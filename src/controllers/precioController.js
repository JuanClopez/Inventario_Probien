// ✅ src/controllers/precioController.js – Versión 2.4 (06 jul 2025)
// 📦 Controlador de Precios – Gestión de precios activos por presentación
// 🧩 Cumple con arquitectura centralizada basada en Supabase
// 🔐 Limpieza post-migración: sin uso de product_id directo

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/precios/:presentation_id – Obtener precio activo por presentación */
/* -------------------------------------------------------------------------- */
const obtenerPrecioProducto = async (req, res) => {
  const { presentation_id } = req.params;

  if (!presentation_id) {
    return res.status(400).json({ mensaje: "Falta el parámetro presentation_id" });
  }

  try {
    const { data: precio, error } = await supabase
      .from("product_prices")
      .select("id, price, iva_rate, is_active, created_at")
      .eq("presentation_id", presentation_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !precio) {
      return res.status(200).json({
        mensaje: "Presentación sin precio activo asignado",
        precio: null,
      });
    }

    return res.status(200).json({ precio });
  } catch (err) {
    console.error("🛑 Error al obtener precio:", err.message);
    return res
      .status(500)
      .json({ mensaje: "Error interno al obtener precio de la presentación" });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/precios – Asignar nuevo precio activo a una presentación         */
/* -------------------------------------------------------------------------- */
const asignarPrecioProducto = async (req, res) => {
  const { presentation_id, price, iva_rate = 0 } = req.body;

  if (!price || typeof price !== "number" || !presentation_id) {
    return res.status(400).json({
      mensaje: "Debe proporcionar presentation_id y un precio numérico válido.",
    });
  }

  try {
    const { data: presentacion, error } = await supabase
      .from("product_presentations")
      .select("id")
      .eq("id", presentation_id)
      .single();

    if (error || !presentacion) {
      return res.status(404).json({
        mensaje: "Presentación no encontrada. Verifica el presentation_id.",
      });
    }

    // 🔁 Desactivar precios anteriores activos
    await supabase
      .from("product_prices")
      .update({ is_active: false })
      .eq("presentation_id", presentation_id)
      .eq("is_active", true);

    // ✅ Insertar nuevo precio activo
    const { data: nuevo, error: errNuevo } = await supabase
      .from("product_prices")
      .insert([{ presentation_id, price, iva_rate, is_active: true }])
      .select()
      .single();

    if (errNuevo) throw errNuevo;

    return res.status(201).json({
      mensaje: "✅ Precio asignado a la presentación correctamente",
      precio: nuevo,
    });
  } catch (err) {
    console.error("🛑 Error al asignar precio:", err.message);
    return res.status(500).json({
      mensaje: "Error interno al asignar precio",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/precios – Listar precios activos de presentaciones                */
/* -------------------------------------------------------------------------- */
const listarPreciosActivos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("product_prices")
      .select(`
        id,
        price,
        iva_rate,
        is_active,
        updated_at,
        presentation_id,
        product_presentations (
          id,
          presentation_name,
          product_id,
          products (
            id,
            name,
            families ( name )
          )
        )
      `)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const resultados = Array.isArray(data)
      ? data.map((item) => {
          const producto = item.product_presentations?.products?.name || "Desconocido";
          const familia = item.product_presentations?.products?.families?.name || "Sin familia";
          const product_id = item.product_presentations?.products?.id || null;
          const presentacion = item.product_presentations?.presentation_name || "";
          const presentation_id = item.presentation_id;

          return {
            id: item.id,
            product_id,
            presentation_id,
            producto,
            presentacion,
            nombre: `${producto} – ${presentacion}`,
            familia,
            base_price: parseFloat(item.price),
            iva_applicable: item.iva_rate > 0,
            iva_rate: item.iva_rate,
            updated_at: item.updated_at,
          };
        })
      : [];

    return res.status(200).json({ productos: resultados });
  } catch (err) {
    console.error("🛑 Error al listar precios activos:", err.message);
    return res.status(500).json({
      mensaje: "Error interno al listar precios activos",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación del módulo                                                     */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerPrecioProducto,
  asignarPrecioProducto,
  listarPreciosActivos,
};
