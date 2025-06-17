// ✅ src/controllers/usuariosController.js
// Controlador para devolver los datos del usuario autenticado

const me = (req, res) => {
  // req.user es inyectado por authMiddleware si el token es válido
  const { id, email, is_admin } = req.user;

  return res.status(200).json({
    id,
    email,
    is_admin
  });
};

module.exports = { me };
