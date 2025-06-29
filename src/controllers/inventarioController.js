// ✅ Ruta: src/controllers/inventarioController.js
// 📌 Propósito: Controlador de Inventario – consulta general, stock puntual y registro inicial
// 🧩 Versión: 1.4 – Última modificación: 27 jun 2025, 4:50 p. m.
// 📌 Cambios aplicados:
// - ✅ Nueva función obtenerStockProducto
// - ✅ Formato estandarizado de respuestas y errores
// - ✅ Alineación con lógica de frontend para mostrar cantidad actual

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* GET /api/inventario?user_id=UUID – Inventario detallado del usuario       */
/* -------------------------------------------------------------------------- */
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

    const inventario = data.map(({ quantity_boxes, quantity_units, products }) => ({
      producto: products?.name || 'Producto desconocido',
      familia: products?.families?.name ?? 'Sin familia',
      cajas: quantity_boxes,
      unidades: quantity_units
    }));

    return res.status(200).json({
      mensaje: 'Inventario obtenido.',
      inventario
    });

  } catch (error) {
    console.error('🛑 obtenerInventario:', error.message);
    return res.status(500).json({
      mensaje: 'Error al obtener inventario.',
      error: error.message
    });
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/inventario/:user_id/:product_id – Stock puntual por producto     */
/* -------------------------------------------------------------------------- */
const obtenerStockProducto = async (req, res) => {
  const { user_id, product_id } = req.params;

  if (!user_id || !product_id) {
    return res.status(400).json({ mensaje: 'Faltan parámetros obligatorios.' });
  }

  try {
    const { data, error } = await supabase
      .from('inventories')
      .select('quantity_boxes, quantity_units')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.status(200).json({
      mensaje: 'Stock consultado.',
      cajas: data?.quantity_boxes ?? 0,
      unidades: data?.quantity_units ?? 0
    });

  } catch (error) {
    console.error('🛑 obtenerStockProducto:', error.message);
    return res.status(500).json({
      mensaje: 'Error al obtener stock del producto.',
      error: error.message
    });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/inventario – Registrar inventario inicial por producto y usuario */
/* -------------------------------------------------------------------------- */
const crearInventario = async (req, res) => {
  const {
    user_id,
    product_id,
    quantity_boxes = 0,
    quantity_units = 0
  } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({
      mensaje: 'Faltan campos obligatorios: user_id o product_id.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('inventories')
      .insert([{ user_id, product_id, quantity_boxes, quantity_units }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje: 'Inventario creado exitosamente.',
      inventario: data
    });

  } catch (error) {
    console.error('🛑 crearInventario:', error.message);
    return res.status(500).json({
      mensaje: 'Error al crear inventario.',
      error: error.message
    });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación de funciones                                                   */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerInventario,
  obtenerStockProducto,
  crearInventario
};
