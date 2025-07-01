// ✅ src/routes/ventaRoutes.js
// Define rutas para registrar y consultar ventas, protegidas por JWT

const express = require('express');
const router = express.Router();
const {
  registrarVenta,
  obtenerVentas,
  obtenerResumenVentas // ← Importar nuevo controlador
} = require('../controllers/ventaController');

/**
 * @route   POST /api/ventas
 * @desc    Registra una nueva venta agrupada
 * @access  Protegido (usuario autenticado)
 */
router.post('/', registrarVenta);

/**
 * @route   GET /api/ventas?user_id=...&fecha_inicio=...&fecha_fin=...&producto_id=...
 * @desc    Lista de ventas del usuario, con filtros opcionales
 * @access  Protegido (usuario autenticado)
 */
router.get('/', obtenerVentas);

/**
 * @route   GET /api/ventas/resumen?user_id=...&month=...
 * @desc    Consulta resumen mensual de ventas y metas por usuario
 * @access  Protegido (usuario autenticado)
 */
router.get('/resumen', obtenerResumenVentas);

module.exports = router;
