// ✅ Ruta: src/routes/inventarioRoutes.js
// 📌 Propósito: Define rutas de inventario para consultar stock y registrar inventario inicial
// 🧩 Versión: 1.2 – Última revisión: 27 jun 2025
// 📌 Cambios aplicados:
// - ✅ Añadida ruta GET /:user_id/:product_id para consultar stock puntual
// - ✅ Alineación con el controller actualizado

const express = require('express');
const {
  obtenerInventario,
  crearInventario,
  obtenerStockProducto
} = require('../controllers/inventarioController');

const router = express.Router();

// 📦 Ruta para obtener todo el inventario de un usuario
router.get('/', obtenerInventario);

// 📌 Ruta para consultar el stock puntual de un producto por usuario
router.get('/:user_id/:product_id', obtenerStockProducto);

// 📝 Ruta para registrar el inventario inicial de un producto
router.post('/', crearInventario);

module.exports = router;
