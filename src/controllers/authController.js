// ✅ src/controllers/authController.js – Versión 1.1 (27 jun 2025)
// Controlador de Autenticación – Login y generación de JWT + retorno de datos del usuario

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan email o password' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, is_admin')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (usuario)' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (contraseña)' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // ✅ Además del token, devolvemos los datos necesarios del usuario
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
};

module.exports = { login };
