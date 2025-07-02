// ✅ Ruta: src/controllers/userAdminController.js
// 🛡️ Propósito: Controlador SOLO para Administradores – Gestión total de usuarios
// 🧩 Versión: 1.4 – Última modificación: 01 jul 2025

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');

/* -------------------------------------------------------------------------- */
/* GET /api/usuarios – Listar todos los usuarios                             */
/* 🔐 Requiere token y rol de admin – Retorna email, rol y fecha de creación */
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
/* 🔐 Requiere token y rol admin – Inserta usuario con contraseña segura     */
/* -------------------------------------------------------------------------- */
const createUser = async (req, res) => {
  const { email, password, is_admin = false } = req.body;

  // 🔒 Validación obligatoria
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan email o password' });
  }

  try {
    // 🔍 Validar duplicado
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (exists) {
      return res.status(409).json({ mensaje: 'El email ya está registrado' });
    }

    // 🔐 Generar hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 📝 Crear usuario
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, is_admin }])
      .select('id, email, is_admin')
      .single();

    if (error) throw error;

    return res.status(201).json({
      mensaje: 'Usuario creado correctamente',
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
