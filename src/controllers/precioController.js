// ✅ src/controllers/precioController.js – Versión 2.1 (03 jul 2025)
// 📌 Controlador de Precios de Productos – Consulta, asignación y listado de precios activos
// 🛡️ Requiere autenticación con authMiddleware (valida user desde token en rutas protegidas)
// 🆕 Cambios en 2.1:
// - ✅ Se implementa función listarPreciosActivos para frontend (PreciosPage.jsx)
// - 🔁 Refactor de estructura y comentarios para mantener consistencia
// - 🧩 Alineado con el resumen maestro v2.7 – Inventario Multicuenta

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
/* GET /api/precios – Listar precios activos de todos los productos           */
/* -------------------------------------------------------------------------- */
const listarPreciosActivos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("product_prices")
      .select(
        `
        id,
        price,
        iva_rate,
        is_active,
        updated_at,
        products (
          id,
          name,
          family_id,
          families ( name )
        )
      `
      )
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const productos = data.map((item) => ({
      id: item.products?.id,
      nombre: item.products?.name,
      familia: item.products?.families?.name || "Sin familia",
      base_price: parseFloat(item.price),
      iva_applicable: item.iva_rate > 0,
      updated_at: item.updated_at,
    }));

    return res.status(200).json({ productos });
  } catch (err) {
    console.error("🛑 Error al listar precios activos:", err.message);
    return res.status(500).json({
      mensaje: "Error interno al listar precios de productos",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación de funciones                                                   */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerPrecioProducto,
  asignarPrecioProducto,
  listarPreciosActivos,
};
