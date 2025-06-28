// ✅ Ruta: src/controllers/dashboardController.js
// 📌 Propósito: Controlador del Dashboard – Obtiene un resumen del inventario, movimientos y productos del usuario autenticado
// 🧩 Versión: 1.2 – Última modificación: 27 jun 2025, 11:56 a. m.
// 📌 Cambios aplicados:
// - ✅ Encabezado normativo con propósito y versión
// - ✅ Comentarios detallados por bloque
// - ✅ Validación de parámetro user_id
// - ✅ Preparado para consolidado versión 1.8

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* GET /api/dashboard?user_id=... – Resumen completo del usuario              */
/* -------------------------------------------------------------------------- */
const obtenerResumenUsuario = async (req, res) => {
  const { user_id } = req.query;

  // 🚫 Validación del parámetro obligatorio
  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

  try {
    // 📊 1. Familias disponibles
    const { data: familias, error: errorFamilias } = await supabase
      .from('families')
      .select('*');
    if (errorFamilias) throw errorFamilias;

    // 📦 2. Productos con nombre de su familia
    const { data: productos, error: errorProductos } = await supabase
      .from('products')
      .select(`
        id,
        name,
        family_id,
        families ( name )
      `);
    if (errorProductos) throw errorProductos;

    // 📋 3. Inventario del usuario
    const { data: inventario, error: errorInventario } = await supabase
      .from('inventories')
      .select(`
        id,
        quantity_boxes,
        quantity_units,
        products (
          name,
          families ( name )
        )
      `)
      .eq('user_id', user_id);
    if (errorInventario) throw errorInventario;

    // 🔄 4. Últimos movimientos del usuario
    const { data: movimientos, error: errorMovimientos } = await supabase
      .from('movements')
      .select(`
        id,
        type,
        quantity_boxes,
        quantity_units,
        description,
        created_at,
        products ( name )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    if (errorMovimientos) throw errorMovimientos;

    // 📦 5. Respuesta formateada para frontend
    return res.status(200).json({
      familias,
      productos: productos.map(p => ({
        id: p.id,
        name: p.name,
        familia: p.families?.name || 'Desconocida'
      })),
      inventario: inventario.map(i => ({
        producto: i.products?.name || 'Desconocido',
        familia: i.products?.families?.name || 'Desconocida',
        cajas: i.quantity_boxes,
        unidades: i.quantity_units
      })),
      movimientos: movimientos.map(m => ({
        id: m.id,
        tipo: m.type,
        producto: m.products?.name || 'Desconocido',
        cajas: m.quantity_boxes,
        unidades: m.quantity_units,
        descripcion: m.description,
        fecha: m.created_at
      }))
    });

  } catch (error) {
    console.error('Error en dashboard:', error.message);
    return res.status(500).json({
      mensaje: 'Error al obtener el resumen del usuario',
      error: error.message
    });
  }
};

module.exports = {
  obtenerResumenUsuario
};
