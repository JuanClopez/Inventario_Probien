// ✅ Rutas de Productos - routes/productoRoutes.js
// Aquí se definen las rutas relacionadas con productos

const express = require('express');
const { getProductos } = require('../controllers/productoController');

const router = express.Router();

// Ruta GET para obtener todos los productos
router.get('/', getProductos);

module.exports = router;