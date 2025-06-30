// ✅ Ruta: src/controllers/usuariosController.js
// 👤 Controlador de Usuario – Devuelve los datos del usuario autenticado
// 📦 Versión: 1.3 – Última modificación: 29 jun 2025, 2:48 p. m.
// 📌 Cambios aplicados:
// - ✅ Añadida función `perfil` para retornar información extendida del usuario
// - ✅ Consulta a Supabase por nombre, apellido y avatar
// - 🔐 Requiere token válido inyectado por `authMiddleware`

const { supabase } = require('../services/supabaseClient');

/* -------------------------------------------------------------------------- */
/* GET /api/me – Datos mínimos desde el JWT                                  */
/* -------------------------------------------------------------------------- */
const me = (req, res) => {
  const { id, email, is_admin } = req.user;
  return res.status(200).json({ id, email, is_admin });
};

/* -------------------------------------------------------------------------- */
/* GET /api/usuarios/perfil – Datos extendidos desde Supabase                */
/* Requiere token – Retorna first_name, last_name, avatar_url, is_admin     */
/* -------------------------------------------------------------------------- */
const perfil = async (req, res) => {
  try {
    const { id } = req.user;

    const { data: perfil, error } = await supabase
      .from('users')
      .select('first_name, last_name, avatar_url, role, is_admin')
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json(perfil);
  } catch (error) {
    console.error('🛑 Error al obtener perfil:', error.message);
    return res.status(500).json({ mensaje: 'Error al obtener perfil' });
  }
};

module.exports = {
  me,
  perfil
};
