// ✅ src/routes/precioRoutes.js – Versión 1.3 (03 jul 2025)
// 📌 Rutas protegidas para gestión de precios (base + IVA) de productos
// 🔒 Requiere JWT – autenticación mediante authMiddleware
// 🆕 Cambios en 1.3:
// - 🧩 Alineado con precioController.js v2.1
// - 📜 Documentación de rutas optimizada
// - 🚧 Preparado para futuras validaciones por rol (admin)

const express = require("express");
const router = express.Router();

const {
  obtenerPrecioProducto,
  asignarPrecioProducto,
  listarPreciosActivos,
} = require("../controllers/precioController");

const { authMiddleware } = require("../middleware/authMiddleware");

/* -------------------------------------------------------------------------- */
/* GET /api/precios – Listar precios activos de todos los productos           */
/* @access Protegido (usuario autenticado via token)                          */
/* -------------------------------------------------------------------------- */
router.get("/", authMiddleware, listarPreciosActivos);

/* -------------------------------------------------------------------------- */
/* GET /api/precios/:product_id – Precio activo de un producto                */
/* @access Protegido (usuario autenticado via token)                          */
/* -------------------------------------------------------------------------- */
router.get("/:product_id", authMiddleware, obtenerPrecioProducto);

/* -------------------------------------------------------------------------- */
/* POST /api/precios – Asignar nuevo precio activo                            */
/* @access Protegido (usuario autenticado via token)                          */
/* @notes Actualmente sin validación por rol – considerar restricción futura  */
/* -------------------------------------------------------------------------- */
router.post("/", authMiddleware, asignarPrecioProducto);

module.exports = router;
