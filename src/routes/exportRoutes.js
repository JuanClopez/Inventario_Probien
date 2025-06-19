// ✅ src/routes/exportRoutes.js
const express = require('express');
const { exportarInventario } = require('../controllers/exportController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/inventario', authMiddleware, exportarInventario);

module.exports = router;
