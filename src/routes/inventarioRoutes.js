// ✅ src/routes/inventarioRoutes.js
const express = require('express');
const { obtenerInventario, crearInventario } = require('../controllers/inventarioController');
const router = express.Router();

// Ruta para obtener todo el inventario
router.get('/', obtenerInventario);

// Ruta para crear un nuevo registro de inventario
router.post('/', crearInventario);

module.exports = router;

