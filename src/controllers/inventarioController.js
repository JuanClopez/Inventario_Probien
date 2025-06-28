// ✅ Ruta: src/controllers/inventarioController.js
// 📌 Propósito: Controlador de Inventario – consulta y registra stock inicial por usuario
// 🧩 Versión: 1.3 – Última modificación: 27 jun 2025, 12:20 p. m.
// 📌 Cambios aplicados:
// - ✅ Estructura normativa y comentarios por bloque
// - ✅ Validación clara de parámetros
// - ✅ Alineación con frontend de dashboard y movimientos
// - ✅ Manejo consistente de productos y familias
// - ⚠️ Se asume que los productos existen previamente

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* GET /api/inventario?user_id=UUID – Inventario detallado del usuario       */
/* -------------------------------------------------------------------------- */
const obtenerInventario = async (req, res) => {
  const { user_id } = req.query;

  // 🚫 Validación del parámetro obligatorio
  if (!user_id) {
    return res.status(400).json({ mensaje: 'Falta el parámetro user_id.' });
  }

  try {
    // 📦 Consulta del inventario con producto y familia relacionados
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

    // 🧾 Formateo del resultado
    const inventario = data.map(
      ({ quantity_boxes, quantity_units, products }) => ({
        producto : products?.name || 'Producto desconocido',
        familia  : products?.families?.name ?? 'Sin familia',
        cajas    : quantity_boxes,
        unidades : quantity_units
      })
    );

    return res.status(200).json({
      mensaje: 'Inventario obtenido.',
      inventario
    });

  } catch (error) {
    console.error('🛑 obtenerInventario:', error.message);
    return res.status(500).json({
      mensaje: 'Error al obtener inventario.',
      error  : error.message
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

  // 🚫 Validación de campos obligatorios
  if (!user_id || !product_id) {
    return res.status(400).json({
      mensaje: 'Faltan campos obligatorios: user_id o product_id.'
    });
  }

  try {
    // 📝 Crear nuevo registro de inventario inicial
    const { data, error } = await supabase
      .from('inventories')
      .insert([
        { user_id, product_id, quantity_boxes, quantity_units }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje   : 'Inventario creado exitosamente.',
      inventario: data
    });

  } catch (error) {
    console.error('🛑 crearInventario:', error.message);
    return res.status(500).json({
      mensaje: 'Error al crear inventario.',
      error  : error.message
    });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación desestructurada                                                */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerInventario,
  crearInventario
};
