// ✅ src/routes/entradaAgrupadaRoutes.js
// 📌 Propósito: Definir rutas para registrar entradas agrupadas (carrito entrada)
// 🧩 Versión: 1.0 – 01 julio 2025

const express = require('express');
const router = express.Router();
const { registrarEntradasAgrupadas } = require('../controllers/entAgrupadaController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/entradas-agrupadas
 * @desc    Registrar múltiples entradas agrupadas con descripción
 * @access  Protegido (usuario autenticado)
 */
router.post('/', authMiddleware, registrarEntradasAgrupadas);

module.exports = router;
