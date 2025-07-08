// ✅ Ruta: src/routes/dashboardRoutes.js – Versión 1.5 (06 jul 2025)
// 🔐 Se añadió el middleware de autenticación para proteger la ruta del dashboard

const express = require("express");
const { obtenerResumenUsuario } = require("../controllers/dashboardController");
const { authMiddleware } = require("../middleware/authMiddleware"); // ✅ Importar middleware de autenticación

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Retorna resumen del inventario, movimientos y productos del usuario autenticado
 * @access  Privado (requiere JWT válido)
 */
router.get("/", authMiddleware, obtenerResumenUsuario); // ✅ Middleware aplicado correctamente

module.exports = router;
