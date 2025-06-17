// ✅ src/controllers/authController.js
// Controlador de Autenticación – Login y generación de JWT

const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* -------------------------------------------------------------------------- */
/* POST /api/login – Autentica email + password y devuelve un token           */
/* -------------------------------------------------------------------------- */
const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('📩 Email recibido:', email);
  console.log('🔑 Password recibido:', password);

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan email o password' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role')
      .eq('email', email)
      .single();

    console.log('📄 Resultado de Supabase:', user);
    console.log('🛑 Error de Supabase:', error);

    if (error || !user) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (usuario)' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    console.log('✅ Password correcto:', passwordOk);

    if (!passwordOk) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas (password)' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error('❌ Error en login:', err.message);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
};


module.exports = { login };
