// ✅ src/controllers/inventarioController.js
// Controlador de Inventario – consulta y crea stock por usuario
//	Desestructuración completada

const { supabase } = require('../services/supabaseClient');

/* ------------------------------------------------------------------ */
/* GET /api/inventario?user_id=UUID  – Inventario de un usuario       */
/* ------------------------------------------------------------------ */
const obtenerInventario = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id.' });
  }

  try {
    const { data, error } = await supabase
      .from('inventories')
      .select(`
        quantity_boxes,
        quantity_units,
        products (
          name,
          families ( name )
        )
      `)
      .eq('user_id', user_id);

    if (error) throw error;

    const inventario = data.map(
      ({ quantity_boxes, quantity_units, products }) => ({
        producto : products?.name,
        familia  : products?.families?.name ?? 'Sin familia',
        cajas    : quantity_boxes,
        unidades : quantity_units
      })
    );

    return res.status(200).json({ mensaje: 'Inventario obtenido.', inventario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al obtener inventario.',
      error  : error.message
    });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/inventario  – Crear registro de inventario inicial       */
/* ------------------------------------------------------------------ */
const crearInventario = async (req, res) => {
  const {
    user_id,
    product_id,
    quantity_boxes  = 0,
    quantity_units  = 0
  } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({
      mensaje: 'Faltan campos obligatorios: user_id o product_id.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('inventories')
      .insert([
        { user_id, product_id, quantity_boxes, quantity_units }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje  : 'Inventario creado exitosamente.',
      inventario: data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al crear inventario.',
      error  : error.message
    });
  }
};

/* ------------------------------------------------------------------ */
/* Exportación desestructurada                                        */
/* ------------------------------------------------------------------ */
module.exports = {
  obtenerInventario,
  crearInventario
};
