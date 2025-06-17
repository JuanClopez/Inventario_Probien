// ✅ Rutas de Productos - routes/productoRoutes.js
// Aquí se definen las rutas relacionadas con productos

const express = require('express');
const { obtenerProductos, crearProducto } = require('../controllers/productoController'); // ✅ Asegúrate de importar ambos

const router = express.Router();

// GET /api/productos → obtener lista de productos
router.get('/', obtenerProductos);

// POST /api/productos → crear nuevo producto
router.post('/', crearProducto);

module.exports = router;