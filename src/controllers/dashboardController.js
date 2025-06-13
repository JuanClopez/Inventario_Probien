// ✅ src/controllers/dashboardController.js
const supabase = require('../services/supabaseClient');

// GET /api/dashboard?user_id=...
const obtenerResumenUsuario = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

  try {
    // 1. Familias
    const { data: familias, error: errorFamilias } = await supabase
      .from('families')
      .select('*');

    if (errorFamilias) throw errorFamilias;

    // 2. Productos (con nombre de familia)
    const { data: productos, error: errorProductos } = await supabase
      .from('products')
      .select(`
        id,
        name,
        family_id,
        families ( name )
      `);

    if (errorProductos) throw errorProductos;

    // 3. Inventario del usuario (con nombre de producto y familia)
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

    // 4. Movimientos del usuario
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

    // 5. Formato de respuesta
    res.json({
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
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el resumen del usuario', error: error.message });
  }
};

module.exports = {
  obtenerResumenUsuario
};
