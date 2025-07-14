// ✅ Ruta: src/controllers/dashboardController.js
// 📌 Controlador del Dashboard – resumen consolidado para usuario autenticado
// 🧩 Versión: 1.8 (12 jul 2025)
// 📦 Cambios aplicados:
// - 🛠 Se corrige envío incorrecto del mes: ya no se pasa "YYYY-MM" como string
// - ✅ Se pasan `year` y `month` como enteros separados (ej. 2025, 7)
// - ✅ Validaciones y comentarios alineados al Resumen Maestro v2.8
// - 🛡️ Compatible con esquema basado en presentation_id

const { supabase } = require("../services/supabaseClient");
const { obtenerResumenMensualPorUsuario } = require("./ventaResumenController");

const obtenerResumenUsuario = async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ mensaje: "Usuario no autenticado." });
  }

  try {
    /* -------------------------------------------------------------------------- */
    /* 📆 0. Año y mes actual en formato numérico (ej. 2025, 7)                   */
    /* -------------------------------------------------------------------------- */
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // ⚠️ JavaScript empieza en 0

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
    const { data: productos, error: errorProductos } = await supabase.from("products").select(`
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
      .select(`
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
      `)
      .eq("user_id", user_id);
    if (errorInventario) throw errorInventario;

    /* -------------------------------------------------------------------------- */
    /* 🔄 4. Últimos movimientos (vía presentación → producto)                     */
    /* -------------------------------------------------------------------------- */
    const { data: movimientos, error: errorMovimientos } = await supabase
      .from("movements")
      .select(`
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
      `)
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
    /* 💰 6. Obtener resumen mensual desde ventaResumenController                 */
    /* -------------------------------------------------------------------------- */
    const resumen_ventas = await obtenerResumenMensualPorUsuario(user_id, year, month); // ✔️ Arreglo aquí

    /* -------------------------------------------------------------------------- */
    /* 📦 7. Respuesta final estandarizada para el frontend                       */
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
      resumen_ventas, // ✅ Consolidado en la misma respuesta
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
