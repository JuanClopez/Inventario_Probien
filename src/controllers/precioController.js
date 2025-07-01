// ✅ src/controllers/precioController.js – Versión 1.0.1 (01 jul 2025)
// 📌 Controlador de Precios de Productos – Asocia precios e IVA por producto
// 🧩 Incluye GET y POST para lectura y asignación de precios
// 🆕 Cambios vs 1.0:
// - ✅ Validación clara si el producto no existe
// - ✅ Mejora en comentarios para facilitar mantenimiento
// - ✅ Desactivación automática de precios anteriores al registrar uno nuevo

const { supabase } = require("../services/supabaseClient");

/* -------------------------------------------------------------------------- */
/* GET /api/precios/:product_id – Obtener precio y IVA del producto           */
/* -------------------------------------------------------------------------- */
const obtenerPrecioProducto = async (req, res) => {
  const { product_id } = req.params;

  if (!product_id) {
    return res.status(400).json({ mensaje: "Falta el parámetro product_id" });
  }

  try {
    // 🔍 Buscar el precio activo más reciente para este producto
    const { data: precio, error } = await supabase
      .from("product_prices")
      .select("id, price, iva_rate, is_active, created_at")
      .eq("product_id", product_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }) // Último creado primero
      .limit(1)
      .single();

    // 📭 Si no tiene precio asignado aún
    if (error || !precio) {
      return res.status(200).json({
        mensaje: "Producto sin precio configurado",
        precio: null,
      });
    }

    return res.status(200).json({ precio });
  } catch (err) {
    console.error("❌ Error al obtener precio:", err.message);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener precio del producto" });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/precios – Crear o actualizar precio de producto                  */
/* -------------------------------------------------------------------------- */
const asignarPrecioProducto = async (req, res) => {
  const { product_id, price, iva_rate = 0 } = req.body;

  // 🛡 Validación de parámetros básicos
  if (!product_id || typeof price !== "number") {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios: product_id y price (numérico)",
    });
  }

  try {
    // ✅ Validar existencia del producto
    const { data: producto, error: errorProducto } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .single();

    if (errorProducto || !producto) {
      return res.status(404).json({
        mensaje:
          "El producto no existe en el sistema. Verifica que esté registrado correctamente.",
      });
    }

    // ❌ Desactivar cualquier precio anterior que esté activo
    await supabase
      .from("product_prices")
      .update({ is_active: false })
      .eq("product_id", product_id);

    // ✅ Insertar nuevo precio activo
    const { data: nuevoPrecio, error } = await supabase
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

    if (error) throw error;

    return res.status(201).json({
      mensaje: "Precio asignado correctamente",
      precio: nuevoPrecio,
    });
  } catch (err) {
    console.error("❌ Error al asignar precio:", err.message);
    return res.status(500).json({ mensaje: "Error al asignar precio" });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportaciones                                                              */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerPrecioProducto,
  asignarPrecioProducto,
};
