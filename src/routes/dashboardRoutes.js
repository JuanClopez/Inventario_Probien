// ✅ src/routes/dashboardRoutes.js
// Rutas del módulo Dashboard – Resumen de usuario autenticado

const express = require('express');
const { obtenerResumenUsuario } = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @route   GET /api/dashboard?user_id=UUID
 * @desc    Retorna resumen del inventario, movimientos y productos del usuario
 * @access  Privado (requiere JWT válido)
 */
router.get('/', obtenerResumenUsuario);

module.exports = router;
