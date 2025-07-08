// ✅ Ruta: src/routes/inventarioRoutes.js – Versión 1.4 (06 jul 2025)
// 📦 Inventario del usuario – totalmente adaptado a presentation_id
// 🛠️ Cambios:
// - Se corrigió la ruta GET de stock puntual para usar :user_id y :presentation_id
// - Alineado con el controlador actualizado obtenerStockPresentacion

const express = require("express");
const {
  obtenerInventario,
  crearInventario,
  obtenerStockPresentacion,
} = require("../controllers/inventarioController");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🔐 Todas las rutas están protegidas por token JWT en server.js             */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/inventario
 * 📦 Obtener todo el inventario del usuario autenticado
 */
router.get("/", obtenerInventario);

/**
 * GET /api/inventario/:user_id/:presentation_id
 * 🔍 Consultar stock puntual por usuario y presentación
 */
router.get("/:user_id/:presentation_id", obtenerStockPresentacion);

/**
 * POST /api/inventario
 * 📝 Registrar inventario inicial de una presentación
 */
router.post("/", crearInventario);

module.exports = router;
