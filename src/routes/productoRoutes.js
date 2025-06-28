// ✅ src/routes/productoRoutes.js – Versión 1.2 (27 jun 2025)
// Rutas de Productos: lectura abierta a usuarios autenticados, creación restringida a admin

const express = require('express');
const { obtenerProductos, crearProducto } = require('../controllers/productoController');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// 🔓 GET /api/productos → obtener lista de productos (requiere token, pero no admin)
router.get('/', obtenerProductos);

// 🔐 POST /api/productos → crear nuevo producto (requiere rol admin)
router.post('/', requireAdmin, crearProducto);

module.exports = router;
