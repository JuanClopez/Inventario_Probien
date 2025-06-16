const express = require('express');
const router = express.Router();
const { registrarVenta, obtenerVentas } = require('../controllers/ventaController');

// Ruta para registrar una venta (POST)
router.post('/', registrarVenta);

// Ruta para obtener ventas por user_id (GET)
router.get('/', obtenerVentas);

module.exports = router;

