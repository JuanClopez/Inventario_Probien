// ✅ src/controllers/userAdminController.js
// Operaciones SOLO‑ADMIN sobre la tabla `users`

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');

/* ------------------------------------------------------------------ */
/* GET /api/usuarios – Listar todos los usuarios                      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* POST /api/usuarios – Crear nuevo usuario                           */
/* body: { email, password, is_admin }                                */
/* ------------------------------------------------------------------ */
const createUser = async (req, res) => {
  const { email, password, is_admin = false } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ mensaje: 'Faltan email o password' });
  }

  try {
    // 1. Verificar duplicado
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (exists) {
      return res.status(409).json({ mensaje: 'El email ya está registrado' });
    }

    // 2. Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Insertar usuario
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

module.exports = { getAllUsers, createUser };
