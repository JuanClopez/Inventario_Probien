// ✅ src/server.js – Versión 1.3 (27 jun 2025)
// Corrección: Rutas /productos y /familias accesibles para usuarios autenticados (solo POST requiere admin)
// Seguridad mejorada y estructura limpia

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────
// 🔓 CORS – Conexión permitida desde el frontend
// ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173', // Cambiar en producción
  credentials: true
}));

app.use(express.json());

// 🔁 Ruta de salud
app.get('/', (_req, res) => {
  res.send('🟢 Servidor funcionando correctamente');
});

// ────────────────────────────────────────────────────────────────
// 📦 Rutas
// ────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const usuariosRoutes    = require('./routes/usuarios');
const inventarioRoutes  = require('./routes/inventarioRoutes');
const movimientoRoutes  = require('./routes/movimientoRoutes');
const ventaRoutes       = require('./routes/ventaRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const exportRoutes      = require('./routes/exportRoutes');
const userAdminRoutes   = require('./routes/userAdminRoutes');
const familiaRoutes     = require('./routes/familiaRoutes');
const productoRoutes    = require('./routes/productoRoutes');

// 🛡️ Middlewares
const { authMiddleware } = require('./middleware/authMiddleware');
const { requireAdmin }   = require('./middleware/roleMiddleware');

// ────────────────────────────────────────────────────────────────
// Rutas públicas
// ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes); // POST /api/login

// ────────────────────────────────────────────────────────────────
// Rutas protegidas – cualquier usuario autenticado
// ────────────────────────────────────────────────────────────────
app.use('/api',              authMiddleware, usuariosRoutes);
app.use('/api/inventario',   authMiddleware, inventarioRoutes);
app.use('/api/movimientos',  authMiddleware, movimientoRoutes);
app.use('/api/ventas',       authMiddleware, ventaRoutes);
app.use('/api/dashboard',    authMiddleware, dashboardRoutes);
app.use('/api/exportar',     authMiddleware, exportRoutes);
app.use('/api/familias',     authMiddleware, familiaRoutes);     // ✅ GET para todos, POST solo admin
app.use('/api/productos',    authMiddleware, productoRoutes);    // ✅ GET para todos, POST solo admin

// 🔒 Rutas exclusivas para administradores
app.use('/api/usuarios',     authMiddleware, requireAdmin, userAdminRoutes);

// ────────────────────────────────────────────────────────────────
// 🚀 Servidor
// ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
