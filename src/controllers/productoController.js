// ✅ Controlador de Productos - src/controllers/productoController.js
// Maneja operaciones sobre la tabla `products` en Supabase

const supabase = require('../services/supabaseClient');

/* ------------------------------------------------------------------ */
/* GET /api/productos  –  Listar todos los productos                  */
/* ------------------------------------------------------------------ */
const obtenerProductos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        family_id,
        families (
          name
        )
      `);

    if (error) throw error;

    // Formatear el resultado para mostrar directamente el nombre de la familia
    const productosFormateados = data.map(p => ({
      id: p.id,
      name: p.name,
      family_id: p.family_id,
      familia: p.families?.name || 'Sin familia'
    }));

    res.status(200).json(productosFormateados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/productos  –  Crear un nuevo producto                    */
/* ------------------------------------------------------------------ */
const crearProducto = async (req, res) => {
  const { family_id, name } = req.body;

  // Validar campos requeridos
  if (!family_id || !name) {
    return res.status(400).json({ mensaje: 'Faltan campos requeridos: family_id y name' });
  }

  // Verificar duplicado
  const { data: existente } = await supabase
    .from('products')
    .select('*')
    .eq('family_id', family_id)
    .eq('name', name)
    .single();

  if (existente) {
    return res.status(409).json({ mensaje: 'El producto ya existe para esta familia' });
  }

  // Insertar producto nuevo
  const { data, error } = await supabase
    .from('products')
    .insert([{ family_id, name }])
    .select();

  if (error) {
    return res.status(500).json({ mensaje: 'Error al crear el producto', error });
  }

  res.status(201).json({ mensaje: 'Producto creado correctamente', data });
};

/* ------------------------------------------------------------------ */
/* Exportar funciones del controlador                                 */
/* ------------------------------------------------------------------ */
module.exports = {
  obtenerProductos,
  crearProducto,
};