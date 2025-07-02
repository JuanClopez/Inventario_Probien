// ✅ Ruta: src/controllers/dashboardController.js
// 📌 Propósito: Controlador del Dashboard – resumen completo de datos del usuario autenticado
// 🧩 Versión: 1.4 – Última modificación: 01 jul 2025
// 📌 Cambios:
// - 🔐 Autenticación reforzada (uso de req.user.id)
// - ✅ Eliminación del query param user_id
// - 🧠 Estructura de respuesta estandarizada

const { supabase } = require('../services/supabaseClient');

const obtenerResumenUsuario = async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ mensaje: 'Usuario no autenticado.' });
  }

  try {
    // 📊 1. Familias disponibles
    const { data: familias, error: errorFamilias } = await supabase
      .from('families')
      .select('*');
    if (errorFamilias) throw errorFamilias;

    // 📦 2. Todos los productos con nombre de familia
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
        product_id,
        quantity_boxes,
        quantity_units,
        products (
          id,
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

    // 🧮 5. Cálculo de productos con bajo stock o sin inventario
    const inventarioPorProducto = new Map();
    inventario.forEach(i => inventarioPorProducto.set(i.product_id, i));

    const productos_bajo_stock = productos
      .filter(p => {
        const inv = inventarioPorProducto.get(p.id);
        return !inv || inv.quantity_boxes <= 5;
      })
      .map(p => ({
        id: p.id,
        name: p.name,
        familia: p.families?.name || 'Desconocida',
        cajas: inventarioPorProducto.get(p.id)?.quantity_boxes || 0
      }));

    // 📦 6. Respuesta final para el frontend
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
      })),
      productos_bajo_stock
    });

  } catch (error) {
    console.error('🛑 Error en obtenerResumenUsuario:', error.message);
    return res.status(500).json({
      mensaje: 'Error al obtener el resumen del usuario',
      error: error.message
    });
  }
};

module.exports = {
  obtenerResumenUsuario
};
