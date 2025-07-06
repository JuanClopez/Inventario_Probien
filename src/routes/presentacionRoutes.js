// ✅ src/routes/presentacionRoutes.js – Versión 1.0 (05 jul 2025)
// 📌 Ruta protegida para obtener presentaciones por producto

const express = require("express");
const router = express.Router();
const { obtenerPresentacionesPorProducto } = require("../controllers/presentacionController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/:product_id", authMiddleware, obtenerPresentacionesPorProducto);

module.exports = router;
