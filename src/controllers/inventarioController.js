// ✅ Ruta: src/controllers/inventarioController.js – Versión 2.1 (06 jul 2025)
// 🔁 Adaptado completamente para usar presentation_id en lugar de product_id
// 🧩 Ahora acepta user_id desde params para stock puntual

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/inventario – Inventario completo del usuario autenticado         */
/* -------------------------------------------------------------------------- */
const obtenerInventario = async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ mensaje: "Usuario no autenticado." });
  }

  try {
    const { data, error } = await supabase
      .from("inventories")
      .select(
        `
        quantity_boxes,
        quantity_units,
        product_presentations (
          presentation_name,
          products (
            name,
            families ( name )
          )
        )
      `
      )
      .eq("user_id", user_id);

    if (error) throw error;

    const inventario = data.map(
      ({ quantity_boxes, quantity_units, product_presentations }) => ({
        producto:
          product_presentations?.products?.name ?? "Producto desconocido",
        presentacion:
          product_presentations?.presentation_name ?? "Sin presentación",
        familia:
          product_presentations?.products?.families?.name ?? "Sin familia",
        cajas: quantity_boxes,
        unidades: quantity_units,
      })
    );

    return res.status(200).json({
      mensaje: "Inventario obtenido correctamente.",
      inventario,
    });
  } catch (error) {
    console.error("🛑 obtenerInventario:", error.message);
    return res.status(500).json({
      mensaje: "Error al obtener inventario.",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/inventario/:user_id/:presentation_id – Stock puntual             */
/* -------------------------------------------------------------------------- */
const obtenerStockPresentacion = async (req, res) => {
  const { user_id, presentation_id } = req.params;

  if (!user_id || !presentation_id) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios." });
  }

  try {
    const { data, error } = await supabase
      .from("inventories")
      .select("quantity_boxes, quantity_units")
      .eq("user_id", user_id)
      .eq("presentation_id", presentation_id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return res.status(200).json({
      mensaje: "Stock consultado.",
      cajas: data?.quantity_boxes ?? 0,
      unidades: data?.quantity_units ?? 0,
    });
  } catch (error) {
    console.error("🛑 obtenerStockPresentacion:", error.message);
    return res.status(500).json({
      mensaje: "Error al obtener stock de la presentación.",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/inventario – Crear inventario inicial                           */
/* -------------------------------------------------------------------------- */
const crearInventario = async (req, res) => {
  const user_id = req.user?.id;
  const { presentation_id, quantity_boxes = 0, quantity_units = 0 } = req.body;

  if (!user_id || !presentation_id) {
    return res.status(400).json({
      mensaje: "Faltan campos obligatorios: presentación no válida.",
    });
  }

  try {
    const { data, error } = await supabase
      .from("inventories")
      .insert([{ user_id, presentation_id, quantity_boxes, quantity_units }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje: "Inventario creado exitosamente.",
      inventario: data,
    });
  } catch (error) {
    console.error("🛑 crearInventario:", error.message);
    return res.status(500).json({
      mensaje: "Error al crear inventario.",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerInventario,
  obtenerStockPresentacion,
  crearInventario,
};
