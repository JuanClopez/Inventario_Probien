// ✅ Ruta: src/controllers/familiaController.js
// 📌 Propósito: Controlador de Familias – CRUD sobre la tabla `families`
// 🧩 Versión: 1.1 – Última modificación: 01 jul 2025

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* GET /api/familias – Obtener todas las familias                            */
/* -------------------------------------------------------------------------- */
const obtenerFamilias = async (_req, res) => {
  try {
    const { data: familias, error } = await supabase
      .from('families')
      .select('*')
      .order('name', { ascending: true }); // 📊 Orden alfabético

    if (error) throw error;

    return res.status(200).json(familias);
  } catch (error) {
    console.error('🛑 obtenerFamilias:', error.message);
    return res.status(500).json({ mensaje: 'Error al obtener familias', error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/familias – Crear una nueva familia                              */
/* -------------------------------------------------------------------------- */
const crearFamilia = async (req, res) => {
  const { name } = req.body;

  // 🔒 Validación de campo obligatorio
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ mensaje: 'El campo "name" es obligatorio y debe ser texto.' });
  }

  try {
    // 🔍 Verificar si la familia ya existe
    const { data: existente, error: errorDup } = await supabase
      .from('families')
      .select('*')
      .eq('name', name)
      .single();

    if (errorDup && errorDup.code !== 'PGRST116') {
      throw errorDup;
    }

    if (existente) {
      return res.status(409).json({ mensaje: 'La familia ya existe.' });
    }

    // ✅ Insertar nueva familia
    const { data: nuevaFamilia, error } = await supabase
      .from('families')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje: 'Familia creada correctamente.',
      familia: nuevaFamilia
    });
  } catch (error) {
    console.error('🛑 crearFamilia:', error.message);
    return res.status(500).json({ mensaje: 'Error al crear la familia.', error: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación de controladores                                              */
/* -------------------------------------------------------------------------- */
module.exports = {
  obtenerFamilias,
  crearFamilia
};
