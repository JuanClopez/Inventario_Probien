// ✅ src/controllers/inventarioController.js
const supabase = require('../services/supabaseClient');

// GET /api/inventario?user_id=UUID
const getInventario = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id' });
  }

  const { data, error } = await supabase
    .from('inventories')
    .select(`
      quantity_boxes,
      quantity_units,
      products (
        name,
        families (name)
      )
    `)
    .eq('user_id', user_id);

  if (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al obtener inventario' });
  }

  const inventarioFormateado = data.map(item => ({
    producto: item.products.name,
    familia: item.products.families.name,
    cajas: item.quantity_boxes,
    unidades: item.quantity_units
  }));

  res.json(inventarioFormateado);
};

// POST /api/inventario
const crearInventario = async (req, res) => {
  const { user_id, product_id, quantity_boxes, quantity_units } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  const { data, error } = await supabase.from('inventories').insert([
    {
      user_id,
      product_id,
      quantity_boxes,
      quantity_units
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al crear inventario', error: error.message });
  }

  res.status(201).json({ mensaje: 'Inventario creado exitosamente', data });
};

module.exports = {
  getInventario,
  crearInventario
};


