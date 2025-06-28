// ✅ Ruta: src/controllers/usuariosController.js
// 👤 Controlador de Usuario – Devuelve los datos del usuario autenticado
// 📦 Versión: 1.2 – Última modificación: 27 jun 2025, 1:03 p. m.
// 📌 Cambios aplicados:
// - ✅ Estandarización de comentarios
// - ✅ Desestructuración explícita
// - ✅ Documentación del origen de `req.user`
// - 🔐 Requiere token válido inyectado por `authMiddleware`

/* -------------------------------------------------------------------------- */
/* GET /api/me – Obtener información del usuario autenticado                  */
/* -------------------------------------------------------------------------- */
const me = (req, res) => {
  // req.user es inyectado por authMiddleware.js tras verificar el token JWT
  const { id, email, is_admin } = req.user;

  return res.status(200).json({
    id,
    email,
    is_admin
  });
};

/* -------------------------------------------------------------------------- */
/* Exportación del controlador                                                */
/* -------------------------------------------------------------------------- */
module.exports = { me };
