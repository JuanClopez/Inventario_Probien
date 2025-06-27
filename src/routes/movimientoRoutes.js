// ✅ src/routes/movimientoRoutes.js – Versión 1.2 (27 jun 2025)
// Rutas protegidas para registrar y consultar movimientos
// Requiere token válido (JWT) y usuario autenticado
// Todas las rutas están protegidas por token JWT (authMiddleware)
// No se requiere rol de administrador para registrar/consultar movimientos propios


const express = require('express');
const {
  registrarMovimiento,
  obtenerMovimientos,
} = require('../controllers/movimientoController');
const { authMiddleware } = require('../middleware/authMiddleware'); // ✅ Middleware de autenticación

const router = express.Router();

// 🔒 Todas las rutas de movimientos requieren token válido
router.use(authMiddleware);

// POST /api/movimientos  → Registrar entrada o salida
router.post('/', registrarMovimiento);

// GET /api/movimientos → Consultar movimientos (con filtros opcionales)
router.get('/', obtenerMovimientos);

module.exports = router;
