// ✅ src/routes/inventarioRoutes.js
const express = require('express');
const { getInventario, crearInventario } = require('../controllers/inventarioController');

const router = express.Router();

// Ruta para obtener todo el inventario
router.get('/', getInventario);

// Ruta para crear un nuevo registro de inventario
router.post('/', crearInventario);

module.exports = router;

