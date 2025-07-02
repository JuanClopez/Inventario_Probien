// ✅ Ruta: src/controllers/authController.js
// 📌 Propósito: Controlador de Autenticación – Login de usuarios, validación de credenciales y emisión de JWT
// 🧩 Versión: 1.2 – Última modificación: 01 jul 2025

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* -------------------------------------------------------------------------- */
/* POST /api/login – Autenticación de usuario y generación de JWT            */
/* -------------------------------------------------------------------------- */
const login = async (req, res) => {
  const { email, password } = req.body;

  // 🔒 Validación de campos requeridos
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan email o password' });
  }

  try {
    // 🔍 Buscar usuario por correo
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, is_admin')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (usuario)' });
    }

    // 🔐 Verificar contraseña con bcrypt
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (contraseña)' });
    }

    // 🧾 Firmar JWT válido por 8 horas
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 📦 Enviar token y usuario al frontend
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
    });

  } catch (err) {
    console.error('🛑 Error en login:', err.message);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
};

module.exports = { login };
