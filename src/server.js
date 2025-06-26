// ✅ src/server.js
// Servidor Principal – Arranca Express, carga variables de entorno
// y conecta todas las rutas con sus respectivos middleware de seguridad.

require('dotenv').config();               // Lee .env
const express = require('express');
const cors = require('cors');             // ✅ Soporte para CORS

const app  = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────
// 🔓 CORS – Permitir conexión desde el frontend (localhost:5173)
// ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',        // ⚠️ Reemplaza con tu dominio en producción
  credentials: true
}));

// 🔧 Middleware para recibir JSON
app.use(express.json());

// 🔁 Ruta de salud (health-check)
app.get('/', (_req, res) => {
  res.send('🟢 Servidor funcionando correctamente');
});

// ────────────────────────────────────────────────────────────────
// 📦 Importación de rutas
// ────────────────────────────────────────────────────────────────

// 1️⃣  Rutas públicas (sin token)
const authRoutes       = require('./routes/authRoutes');          // /api/login

// 2️⃣  Rutas para usuarios autenticados
const usuariosRoutes   = require('./routes/usuarios');
const inventarioRoutes = require('./routes/inventarioRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const ventaRoutes      = require('./routes/ventaRoutes');
const dashboardRoutes  = require('./routes/dashboardRoutes');
const exportRoutes     = require('./routes/exportRoutes');

// 3️⃣  Rutas exclusivas de administrador
const userAdminRoutes  = require('./routes/userAdminRoutes');
const familiaRoutes    = require('./routes/familiaRoutes');
const productoRoutes   = require('./routes/productoRoutes');

// 🛡️ Middlewares de seguridad
const { authMiddleware }   = require('./middleware/authMiddleware');
const { requireAdmin }     = require('./middleware/roleMiddleware');

// ────────────────────────────────────────────────────────────────
// 📍 Rutas públicas
// ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);                                    // POST /api/login

// ────────────────────────────────────────────────────────────────
// 🔐 Rutas protegidas (requieren token JWT)
// ────────────────────────────────────────────────────────────────
app.use('/api',            authMiddleware, usuariosRoutes);     // GET  /api/me
app.use('/api/inventario', authMiddleware, inventarioRoutes);   // GET
app.use('/api/movimientos',authMiddleware, movimientoRoutes);   // GET/POST
app.use('/api/ventas',     authMiddleware, ventaRoutes);        // GET/POST
app.use('/api/dashboard',  authMiddleware, dashboardRoutes);    // GET
app.use('/api/exportar',   authMiddleware, exportRoutes);       // GET CSV

// ────────────────────────────────────────────────────────────────
// 🛠️ Rutas exclusivas de admin
// ────────────────────────────────────────────────────────────────
app.use('/api/usuarios',  authMiddleware, requireAdmin, userAdminRoutes);
app.use('/api/familias',  authMiddleware, requireAdmin, familiaRoutes);
app.use('/api/productos', authMiddleware, requireAdmin, productoRoutes);

// ────────────────────────────────────────────────────────────────
// 🚀 Arranque del servidor
// ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
