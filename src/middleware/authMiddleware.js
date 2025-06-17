// ✅ src/middleware/authMiddleware.js
// Verifica el JWT y añade req.user

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Cabecera esperada: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

module.exports = { authMiddleware };
