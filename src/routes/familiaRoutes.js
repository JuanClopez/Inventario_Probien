// ✅ Rutas de Familias - src/routes/familiaRoutes.js
// Define las rutas relacionadas con familias de productos

const express = require('express');
const { obtenerFamilias, crearFamilia } = require('../controllers/familiaController');

const router = express.Router();

// Ruta GET para obtener todas las familias (líneas de productos)
router.get('/', obtenerFamilias);

// Ruta POST para crear una nueva familia
router.post('/', crearFamilia);

module.exports = router;