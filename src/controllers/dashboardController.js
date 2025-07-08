// ✅ Ruta: src/controllers/dashboardController.js
// 📌 Controlador del Dashboard – resumen completo de datos del usuario autenticado
// 🧩 Versión: 1.6 – Actualización crítica 08 jul 2025
// 📦 Cambios aplicados:
// - ✅ Inventario: relación indirecta a productos usando presentation_id
// - ✅ Movimientos: corregido acceso a productos mediante product_presentations
// - ✅ Productos con bajo stock: ahora basados en sumatoria de cajas por producto (con múltiples presentaciones)
// - ✅ Comentarios alineados al resumen maestro – estructura clara y trazable

const { supabase } = require("../services/supabaseClient");

const obtenerResumenUsuario = async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ mensaje: "Usuario no autenticado." });
  }

  try {
    /* -------------------------------------------------------------------------- */
    /* 📊 1. Familias disponibles                                                 */
    /* -------------------------------------------------------------------------- */
    const { data: familias, error: errorFamilias } = await supabase
      .from("families")
      .select("*");
    if (errorFamilias) throw errorFamilias;

    /* -------------------------------------------------------------------------- */
    /* 📦 2. Productos con sus familias                                           */
    /* -------------------------------------------------------------------------- */
    const { data: productos, error: errorProductos } = await supabase.from(
      "products"
    ).select(`
        id,
        name,
        family_id,
        families ( name )
      `);
    if (errorProductos) throw errorProductos;

    /* -------------------------------------------------------------------------- */
    /* 📋 3. Inventario por presentación (con acceso a producto y familia)        */
    /* -------------------------------------------------------------------------- */
    const { data: inventario, error: errorInventario } = await supabase
      .from("inventories")
      .select(
        `
        id,
        quantity_boxes,
        quantity_units,
        presentation_id,
        product_presentations (
          id,
          presentation_name,
          products (
            id,
            name,
            families ( name )
          )
        )
      `
      )
      .eq("user_id", user_id);
    if (errorInventario) throw errorInventario;

    /* -------------------------------------------------------------------------- */
    /* 🔄 4. Últimos movimientos (vía presentación → producto)                     */
    /* -------------------------------------------------------------------------- */
    const { data: movimientos, error: errorMovimientos } = await supabase
      .from("movements")
      .select(
        `
        id,
        type,
        quantity_boxes,
        quantity_units,
        description,
        created_at,
        product_presentations (
          presentation_name,
          products (
            name
          )
        )
      `
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (errorMovimientos) throw errorMovimientos;

    /* -------------------------------------------------------------------------- */
    /* 🧮 5. Cálculo de productos con bajo stock                                  */
    /* -------------------------------------------------------------------------- */
    const inventarioPorProducto = new Map();
    inventario.forEach((i) => {
      const producto = i.product_presentations?.products;
      const prodId = producto?.id;
      const cajas = i.quantity_boxes || 0;

      if (prodId) {
        const existente = inventarioPorProducto.get(prodId);
        if (existente) {
          existente.total_cajas += cajas;
        } else {
          inventarioPorProducto.set(prodId, {
            id: prodId,
            name: producto?.name || "Desconocido",
            familia: producto?.families?.name || "Desconocida",
            total_cajas: cajas,
          });
        }
      }
    });

    const productos_bajo_stock = Array.from(inventarioPorProducto.values())
      .filter((p) => p.total_cajas <= 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        familia: p.familia,
        cajas: p.total_cajas,
      }));

    /* -------------------------------------------------------------------------- */
    /* 📦 6. Respuesta final estandarizada para el frontend                       */
    /* -------------------------------------------------------------------------- */
    return res.status(200).json({
      familias,
      productos: productos.map((p) => ({
        id: p.id,
        name: p.name,
        familia: p.families?.name || "Desconocida",
      })),
      inventario: inventario.map((i) => ({
        producto: i.product_presentations?.products?.name || "Desconocido",
        presentacion: i.product_presentations?.presentation_name || "",
        familia:
          i.product_presentations?.products?.families?.name || "Desconocida",
        cajas: i.quantity_boxes,
        unidades: i.quantity_units,
      })),
      movimientos: movimientos.map((m) => ({
        id: m.id,
        tipo: m.type,
        producto: m.product_presentations?.products?.name || "Desconocido",
        presentacion: m.product_presentations?.presentation_name || "",
        cajas: m.quantity_boxes,
        unidades: m.quantity_units,
        descripcion: m.description,
        fecha: m.created_at,
      })),
      productos_bajo_stock,
    });
  } catch (error) {
    console.error("🛑 Error en obtenerResumenUsuario:", error.message);
    return res.status(500).json({
      mensaje: "Error al obtener el resumen del usuario",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerResumenUsuario,
};
