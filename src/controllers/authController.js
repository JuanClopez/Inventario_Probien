// ✅ src/controllers/authController.js
// Controlador de Autenticación – Login y generación de JWT

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* -------------------------------------------------------------------------- */
/* POST /api/login – Autentica email + password y devuelve un token           */
/* -------------------------------------------------------------------------- */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan email o password' });
  }

  console.log('📩 Email recibido:', email);
  console.log('🔑 Password recibido:', password);

  try {
    /* 1. Buscar usuario por email */
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, is_admin')
      .eq('email', email)
      .single();

    console.log('📄 Resultado de Supabase:', user);
    if (error || !user) {
      console.error('🛑 Error de Supabase:', error);
      return res.status(401).json({ mensaje: 'Credenciales inválidas (usuario)' });
    }

    /* 2. Comparar password */
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (contraseña)' });
    }

    /* 3. Generar JWT */
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error('Error en login:', err.message);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
};

module.exports = { login };
