// ✅ src/controllers/precioController.js – Versión 2.0 (01 jul 2025)
// 📌 Controlador de Precios de Productos – Asigna precios activos con IVA por producto
// 🛡️ Requiere autenticación con authMiddleware (valida user desde token en rutas protegidas)
// 🆕 Cambios en 2.0:
// - 🔐 Seguridad reforzada (solo usuarios autenticados)
// - ✅ Mejora de validaciones y mensajes claros
// - 📦 Desactiva precios previos antes de asignar uno nuevo
// - 🧩 Totalmente alineado con el resumen maestro v2.6

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/precios/:product_id – Obtener precio activo de un producto        */
/* -------------------------------------------------------------------------- */
const obtenerPrecioProducto = async (req, res) => {
  const { product_id } = req.params;

  if (!product_id) {
    return res.status(400).json({ mensaje: "Falta el parámetro product_id" });
  }

  try {
    const { data: precio, error } = await supabase
      .from("product_prices")
      .select("id, price, iva_rate, is_active, created_at")
      .eq("product_id", product_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !precio) {
      return res.status(200).json({
        mensaje: "Producto sin precio activo asignado",
        precio: null,
      });
    }

    return res.status(200).json({ precio });
  } catch (err) {
    console.error("🛑 Error al obtener precio:", err.message);
    return res
      .status(500)
      .json({ mensaje: "Error interno al obtener precio del producto" });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/precios – Asignar nuevo precio activo a un producto              */
/* -------------------------------------------------------------------------- */
const asignarPrecioProducto = async (req, res) => {
  const { product_id, price, iva_rate = 0 } = req.body;

  if (!product_id || typeof price !== "number") {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios: product_id y price (numérico)",
    });
  }

  try {
    // 📦 Validar que el producto exista
    const { data: producto, error: errorProducto } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .single();

    if (errorProducto || !producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado. Verifica el product_id.",
      });
    }

    // 🔁 Desactivar precios previos activos
    const { error: errorDesactivacion } = await supabase
      .from("product_prices")
      .update({ is_active: false })
      .eq("product_id", product_id)
      .eq("is_active", true);

    if (errorDesactivacion) {
      console.warn("⚠️ No se pudieron desactivar precios previos");
    }

    // ✅ Insertar nuevo precio activo
    const { data: nuevoPrecio, error: errorNuevo } = await supabase
      .from("product_prices")
      .insert([
        {
          product_id,
          price,
          iva_rate,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (errorNuevo) throw errorNuevo;

    return res.status(201).json({
      mensaje: "✅ Precio asignado correctamente",
      precio: nuevoPrecio,
    });
  } catch (err) {
    console.error("🛑 Error al asignar precio:", err.message);
    return res.status(500).json({
      mensaje: "Error interno al asignar precio al producto",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación de funciones                                                   */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerPrecioProducto,
  asignarPrecioProducto,
};
