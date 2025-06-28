// ✅ Ruta: src/controllers/userAdminController.js
// 🛡️ Controlador SOLO para Administradores – Gestión total de usuarios
// 📦 Versión: 1.3 – Última modificación: 27 jun 2025, 12:49 p. m.
// 📌 Cambios aplicados:
// - ✅ Comentarios explicativos con estructura unificada
// - ✅ Validación clara en el POST
// - ✅ Protección contra duplicados
// - ✅ Hash de contraseña con bcrypt
// - 🔐 Asegurado para rutas protegidas con middleware requireAdmin

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');

/* -------------------------------------------------------------------------- */
/* GET /api/usuarios – Listar todos los usuarios                             */
/* Requiere token y rol de admin – Muestra correo, rol y fecha de creación  */
/* -------------------------------------------------------------------------- */
const getAllUsers = async (_req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, is_admin, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json(users);
  } catch (error) {
    console.error('🛑 getAllUsers:', error.message);
    return res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/usuarios – Crear nuevo usuario                                  */
/* 🔐 Requiere token y rol admin – Inserta usuario con hash bcrypt           */
/* -------------------------------------------------------------------------- */
const createUser = async (req, res) => {
  const { email, password, is_admin = false } = req.body;

  // ⚠️ Validación básica
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan email o password' });
  }

  try {
    // 🔍 Validar si el email ya existe
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (exists) {
      return res.status(409).json({ mensaje: 'El email ya está registrado' });
    }

    // 🔑 Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 📝 Insertar usuario
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, is_admin }])
      .select('id, email, is_admin')
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje: 'Usuario creado',
      usuario: newUser
    });
  } catch (error) {
    console.error('🛑 createUser:', error.message);
    return res.status(500).json({ mensaje: 'Error al crear usuario' });
  }
};

/* -------------------------------------------------------------------------- */
/* Exportación del módulo                                                    */
/* -------------------------------------------------------------------------- */
module.exports = {
  getAllUsers,
  createUser
};
