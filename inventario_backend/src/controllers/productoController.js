// ✅ Controlador de Productos - controllers/productoController.js
// Aquí se define la lógica para obtener los productos desde la tabla en Supabase

const supabase = require('../services/supabaseClient');

// GET /api/productos
const getProductos = async (req, res) => {
  const { data, error } = await supabase.from('productos').select('*');

  if (error) {
    // Si hay error, se responde con 500 y el mensaje de error
    return res.status(500).json({ message: 'Error al obtener productos', error });
  }

  // Respuesta con los datos obtenidos
  res.status(200).json(data);
};

module.exports = { getProductos };