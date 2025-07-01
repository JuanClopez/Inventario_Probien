// ✅ src/server.js – Versión 1.5 (01 jul 2025)
// 🆕 Integración de resumen de ventas mensuales
// 📦 Rutas /ventas/resumen agregadas (GET para usuarios autenticados)
// ✅ Seguridad y modularidad mantenidas

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────
// 🔓 CORS – Conexión permitida desde el frontend
// ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "http://localhost:5173", // Cambiar en producción
    credentials: true,
  })
);

app.use(express.json());

// 🔁 Ruta de salud
app.get("/", (_req, res) => {
  res.send("🟢 Servidor funcionando correctamente");
});

// ────────────────────────────────────────────────────────────────
// 📦 Rutas
// ────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const usuariosRoutes = require("./routes/usuarios");
const inventarioRoutes = require("./routes/inventarioRoutes");
const movimientoRoutes = require("./routes/movimientoRoutes");
const ventaRoutes = require("./routes/ventaRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const userAdminRoutes = require("./routes/userAdminRoutes");
const familiaRoutes = require("./routes/familiaRoutes");
const productoRoutes = require("./routes/productoRoutes");
const precioRoutes = require("./routes/precioRoutes");
const ventaResumenRoutes = require("./routes/ventaResumenRoutes"); // ✅ NUEVA ruta de resumen mensual

// 🛡️ Middlewares
const { authMiddleware } = require("./middleware/authMiddleware");
const { requireAdmin } = require("./middleware/roleMiddleware");

// ────────────────────────────────────────────────────────────────
// Rutas públicas
// ────────────────────────────────────────────────────────────────
app.use("/api", authRoutes); // POST /api/login

// ────────────────────────────────────────────────────────────────
// Rutas protegidas – cualquier usuario autenticado
// ────────────────────────────────────────────────────────────────
app.use("/api", authMiddleware, usuariosRoutes);
app.use("/api/inventario", authMiddleware, inventarioRoutes);
app.use("/api/movimientos", authMiddleware, movimientoRoutes);
app.use("/api/ventas", authMiddleware, ventaRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/exportar", authMiddleware, exportRoutes);
app.use("/api/familias", authMiddleware, familiaRoutes);
app.use("/api/productos", authMiddleware, productoRoutes);
app.use("/api/precios", authMiddleware, precioRoutes);
app.use("/api/ventas/resumen", authMiddleware, ventaResumenRoutes); // ✅ NUEVA ruta de resumen mensual

// 🔒 Rutas exclusivas para administradores
app.use("/api/usuarios", authMiddleware, requireAdmin, userAdminRoutes);

// ────────────────────────────────────────────────────────────────
// 🚀 Servidor
// ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
