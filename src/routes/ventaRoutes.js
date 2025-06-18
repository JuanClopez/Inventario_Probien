// ✅ src/routes/ventaRoutes.js
// Define rutas para registrar y consultar ventas, protegidas por JWT

const express = require('express');
const router = express.Router();
const { registrarVenta, obtenerVentas } = require('../controllers/ventaController');

/**
 * @route   POST /api/ventas
 * @desc    Registra una nueva venta
 * @access  Protegido (usuario autenticado)
 */
router.post('/', registrarVenta);

/**
 * @route   GET /api/ventas?user_id=...&fecha_inicio=...&fecha_fin=...&producto_id=...
 * @desc    Devuelve todas las ventas del usuario, con filtros opcionales
 * @access  Protegido (usuario autenticado)
 */
router.get('/', obtenerVentas);

module.exports = router;
