// ✅ src/routes/movimientoRoutes.js – Versión 1.3 (27 jun 2025)
// Requiere token válido (JWT) y usuario autenticado
// Todas las rutas están protegidas por token JWT (authMiddleware)
// No se requiere rol de administrador para registrar/consultar movimientos propios
// Rutas protegidas para movimientos – requiere JWT pero no rol de administrador

const express = require('express');
const {
  registrarMovimiento,
  obtenerMovimientos
} = require('../controllers/movimientoController');

const router = express.Router();

// 🛡️ Todas las rutas en /api/movimientos están protegidas en server.js con authMiddleware
// No requiere aplicar middleware aquí nuevamente

// POST /api/movimientos → Registrar entrada o salida
router.post('/', registrarMovimiento);

// GET /api/movimientos → Consultar movimientos (con filtros opcionales)
router.get('/', obtenerMovimientos);

module.exports = router;
