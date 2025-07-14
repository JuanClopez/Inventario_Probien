// ✅ src/routes/ventaResumenRoutes.js – Versión 1.0 (01 jul 2025)
// 📌 Rutas de Resumen de Ventas – Permite obtener un resumen mensual por usuario
// 🧩 Requiere autenticación JWT, usa el controlador `ventaResumenController.js`

const express = require("express");
const {
  obtenerResumenVentas,
} = require("../controllers/ventaResumenController");
const router = express.Router();

// 🔐 GET /api/ventas/resumen?user_id=...&month=YYYY-MM
// Devuelve resumen de ventas, IVA, descuentos, neto y meta mensual
router.get("/", obtenerResumenVentas);

module.exports = router;
