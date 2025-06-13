// ✅ Controlador de Familias - src/controllers/familiaController.js
// Encargado de manejar la lógica para obtener familias (líneas de productos) desde Supabase
// Lógica relacionada con la tabla 'families'

const supabase = require('../services/supabaseClient');

// ✅ Obtener todas las familias
const obtenerFamilias = async (req, res) => {
  try {
    const { data, error } = await supabase.from('families').select('*');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Crear nueva familia
const crearFamilia = async (req, res) => {
  const { name } = req.body;

  // Validar campo obligatorio
  if (!name) {
    return res.status(400).json({ mensaje: 'El campo "name" es obligatorio.' });
  }

  // Verificar si ya existe esa familia (evitar duplicados)
  const { data: existente, error: errorBusqueda } = await supabase
    .from('families')
    .select('*')
    .eq('name', name)
    .single();

  if (existente) {
    return res.status(409).json({ mensaje: 'La familia ya existe.' });
  }

  // Insertar nueva familia
  const { data, error } = await supabase
    .from('families')
    .insert([{ name }])
    .select();

  if (error) {
    return res.status(500).json({ mensaje: 'Error al crear la familia.', error });
  }

  res.status(201).json({ mensaje: 'Familia creada correctamente.', data });
};

// ✅ Exportar controladores
module.exports = {
  obtenerFamilias,
  crearFamilia, // 👈 Asegúrate de incluirlo acá
};