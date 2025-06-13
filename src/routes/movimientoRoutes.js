// ✅ src/routes/movimientoRoutes.js
const express = require('express');
const { registrarMovimiento } = require('../controllers/movimientoController');

const router = express.Router();

// POST /api/movimientos  → Registrar entrada o salida
router.post('/', registrarMovimiento);

module.exports = router;