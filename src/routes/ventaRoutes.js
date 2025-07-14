// ✅ src/routes/ventaRoutes.js – Versión 1.3 (12 jul 2025)
// 📌 Rutas de ventas protegidas – Incluye ventas agrupadas, resumen mensual y top productos
// 🔐 JWT obligatorio – ya protegido desde server.js con authMiddleware
// 📦 Cambios v1.3:
// - 🐛 Se corrigió importación incorrecta de función desde ventaResumenController.js
// - ✅ El endpoint /resumen ya apunta correctamente a obtenerResumenMensualPorUsuario
// - 🛠️ Error crítico solucionado que impedía arrancar el servidor

const express = require("express");
const router = express.Router();

const {
  registrarVenta,
  obtenerVentas,
  obtenerTopProductos,
} = require("../controllers/ventaController");

const {
  obtenerResumenMensualPorUsuario, // ✅ Importación corregida
} = require("../controllers/ventaResumenController");

/**
 * @route   POST /api/ventas
 * @desc    Registra una nueva venta agrupada
 * @access  Protegido (usuario autenticado via token)
 */
router.post("/", registrarVenta);

/**
 * @route   GET /api/ventas?fecha_inicio=...&fecha_fin=...&producto_id=...
 * @desc    Lista de ventas del usuario autenticado (filtradas opcionalmente)
 * @access  Protegido (usuario autenticado via token)
 */
router.get("/", obtenerVentas);

/**
 * @route   GET /api/ventas/resumen?month=YYYY-MM
 * @desc    Consulta resumen mensual de ventas y metas para el usuario autenticado
 * @access  Protegido (usuario autenticado via token)
 */
router.get("/resumen", obtenerResumenMensualPorUsuario); // ✅ Corregido

/**
 * @route   GET /api/ventas/top-productos?user_id=...&fecha_inicio=...&fecha_fin=...
 * @desc    Consulta los 5 productos más vendidos por cajas en un rango de fechas
 * @access  Protegido (usuario autenticado)
 */
router.get("/top-productos", obtenerTopProductos);

module.exports = router;
