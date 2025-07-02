// ✅ src/routes/ventaRoutes.js – Versión 1.1 (01 jul 2025)
// 📌 Rutas de ventas protegidas – usa req.user.id del token (no se requiere user_id en body o query)
// 🔒 JWT obligatorio – ya protegido desde server.js con authMiddleware

const express = require('express');
const router = express.Router();

const {
  registrarVenta,
  obtenerVentas,
  obtenerResumenVentas,
} = require('../controllers/ventaController');

/**
 * @route   POST /api/ventas
 * @desc    Registra una nueva venta agrupada
 * @access  Protegido (usuario autenticado via token)
 * @notes   Ya no se usa req.body.user_id – el ID viene del token
 */
router.post('/', registrarVenta);

/**
 * @route   GET /api/ventas?fecha_inicio=...&fecha_fin=...&producto_id=...
 * @desc    Lista de ventas del usuario autenticado (filtradas opcionalmente)
 * @access  Protegido (usuario autenticado via token)
 * @notes   Ya no se usa query user_id – el ID viene del token
 */
router.get('/', obtenerVentas);

/**
 * @route   GET /api/ventas/resumen?month=...
 * @desc    Consulta resumen mensual de ventas y metas para el usuario autenticado
 * @access  Protegido (usuario autenticado via token)
 * @notes   El user_id también se toma del token
 */
router.get('/resumen', obtenerResumenVentas);

module.exports = router;
