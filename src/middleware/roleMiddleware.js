// inventario-backend/src/middleware/roleMiddleware.js

/**
 * Middleware para verificar si el usuario tiene rol de administrador.
 * Se debe usar en rutas que requieren permisos especiales como crear productos, familias o usuarios.
 */

const requireAdmin = (req, res, next) => {
  try {
    // req.user debe ser establecido por el middleware de autenticación (authMiddleware.js)
    if (!req.user) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }

    // Validamos si es administrador
    if (!req.user.is_admin) {
      return res.status(403).json({ mensaje: "Acceso denegado: solo para administradores" });
    }

    // Si todo está correcto, sigue al siguiente middleware o controlador
    next();
  } catch (error) {
    console.error("🛑 Error en requireAdmin:", error);
    res.status(500).json({ mensaje: "Error interno en validación de rol" });
  }
};

module.exports = { requireAdmin };
