// ✅ src/controllers/familiaController.js
// Controlador de Familias – Maneja CRUD sobre la tabla `families`
//	Desestructuración completada

const { supabase } = require('../services/supabaseClient');

/* ------------------------------------------------------------------ */
/* GET /api/familias – Obtener todas las familias                     */
/* ------------------------------------------------------------------ */
const obtenerFamilias = async (_req, res) => {
  try {
    const { data: familias, error } = await supabase
      .from('families')
      .select('*')
      .order('name', { ascending: true }); // opcional: orden alfabético

    if (error) throw error;

    return res.status(200).json(familias);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener familias', error: error.message });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/familias – Crear una nueva familia                       */
/* ------------------------------------------------------------------ */
const crearFamilia = async (req, res) => {
  const { name } = req.body;

  // Validación de campo obligatorio
  if (!name) {
    return res.status(400).json({ mensaje: 'El campo "name" es obligatorio.' });
  }

  /* ---------- Verificar duplicado ---------- */
  const { data: existente, error: errorDup } = await supabase
    .from('families')
    .select('*')
    .eq('name', name)
    .single();

  if (errorDup && errorDup.code !== 'PGRST116') {
    return res.status(500).json({ mensaje: 'Error verificando duplicado', error: errorDup.message });
  }

  if (existente) {
    return res.status(409).json({ mensaje: 'La familia ya existe.' });
  }

  /* ---------- Insertar nueva familia ---------- */
  const { data: nuevaFamilia, error } = await supabase
    .from('families')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ mensaje: 'Error al crear la familia.', error: error.message });
  }

  return res.status(201).json({
    mensaje: 'Familia creada correctamente.',
    familia: nuevaFamilia
  });
};

/* ------------------------------------------------------------------ */
/* Exportar controladores                                             */
/* ------------------------------------------------------------------ */
module.exports = {
  obtenerFamilias,
  crearFamilia
};
