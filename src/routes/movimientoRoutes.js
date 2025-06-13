// ✅ src/routes/movimientoRoutes.js
const express = require('express');
const { registrarMovimiento, obtenerMovimientos } = require('../controllers/movimientoController'); // ✅ Agregado obtenerMovimientos


const router = express.Router();

// POST /api/movimientos  → Registrar entrada o salida
router.post('/', registrarMovimiento);
router.get('/', obtenerMovimientos);   // GET

module.exports = router;