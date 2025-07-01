// ✅ src/routes/precioRoutes.js – Versión 1.0 (01 jul 2025)
// 📌 Rutas para manejo de precios de productos (precio e IVA)
// 🔐 POST restringido a administradores, GET disponible para usuarios autenticados

const express = require("express");
const router = express.Router();

// 🧩 Controladores
const {
  obtenerPrecioProducto,
  asignarPrecioProducto,
} = require("../controllers/precioController");

// 🛡 Middlewares
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

/* -------------------------------------------------------------------------- */
/* GET /api/precios/:product_id – Obtener precio activo del producto          */
/* 📌 Acceso: usuario autenticado (no requiere admin)                         */
/* -------------------------------------------------------------------------- */
router.get("/:product_id", authMiddleware, obtenerPrecioProducto);

/* -------------------------------------------------------------------------- */
/* POST /api/precios – Asignar nuevo precio e IVA a un producto               */
/* 📌 Acceso: solo administradores                                            */
/* -------------------------------------------------------------------------- */
router.post("/", authMiddleware, requireAdmin, asignarPrecioProducto);

/* -------------------------------------------------------------------------- */
/* Exportación del router                                                     */
/* -------------------------------------------------------------------------- */
module.exports = router;
