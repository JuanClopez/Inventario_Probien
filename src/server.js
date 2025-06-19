// ✅ src/server.js
// Servidor Principal – Arranca Express, carga variables de entorno
// y conecta todas las rutas con sus respectivos middleware de seguridad.

require('dotenv').config();               // Lee .env
const express = require('express');

// ────────────────────────────────────────────────────────────────
// Rutas (agrupadas por tipo)
// ────────────────────────────────────────────────────────────────

// 1️⃣  Rutas públicas (sin token)
const authRoutes       = require('./routes/authRoutes');          // /api/login

// 2️⃣  Rutas para cualquier usuario autenticado (token válido)
const usuariosRoutes   = require('./routes/usuarios');            // /api/me
const inventarioRoutes = require('./routes/inventarioRoutes');    // Inventario actual
const movimientoRoutes = require('./routes/movimientoRoutes');    // Entradas / salidas
const ventaRoutes      = require('./routes/ventaRoutes');         // Ventas
const dashboardRoutes  = require('./routes/dashboardRoutes');     // Resumen completo
const exportRoutes     = require('./routes/exportRoutes');        // Exportar CSV

// 3️⃣  Rutas exclusivas de administrador
const userAdminRoutes  = require('./routes/userAdminRoutes');     // CRUD usuarios
const familiaRoutes    = require('./routes/familiaRoutes');       // CRUD familias
const productoRoutes   = require('./routes/productoRoutes');      // CRUD productos

// ────────────────────────────────────────────────────────────────
// Middleware globales
// ────────────────────────────────────────────────────────────────
const { authMiddleware }   = require('./middleware/authMiddleware');
const { requireAdmin }     = require('./middleware/roleMiddleware');

const app  = express();
const PORT = process.env.PORT || 3000;

// Habilita recepción de JSON en todas las peticiones
app.use(express.json());

// Ruta de salud (health‑check)
app.get('/', (_req, res) => {
  res.send('🟢 Servidor funcionando correctamente');
});

// ────────────────────────────────────────────────────────────────
// 1️⃣  Rutas públicas
// ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);                                    // POST /api/login

// ────────────────────────────────────────────────────────────────
// 2️⃣  Rutas protegidas (token JWT requerido)
//     Se aplica authMiddleware primero y luego la ruta correspondiente
// ────────────────────────────────────────────────────────────────
app.use('/api',            authMiddleware, usuariosRoutes);     // GET  /api/me
app.use('/api/inventario', authMiddleware, inventarioRoutes);   // Inventario
app.use('/api/movimientos',authMiddleware, movimientoRoutes);   // Movimientos
app.use('/api/ventas',     authMiddleware, ventaRoutes);        // Ventas
app.use('/api/dashboard',  authMiddleware, dashboardRoutes);    // Dashboard
app.use('/api/exportar',   authMiddleware, exportRoutes);       // Exportar CSV

// ────────────────────────────────────────────────────────────────
// 3️⃣  Rutas exclusivas de administrador
//     authMiddleware + requireAdmin en cascada
// ────────────────────────────────────────────────────────────────
app.use('/api/usuarios',  authMiddleware, requireAdmin, userAdminRoutes);
app.use('/api/familias',  authMiddleware, requireAdmin, familiaRoutes);
app.use('/api/productos', authMiddleware, requireAdmin, productoRoutes);

// ────────────────────────────────────────────────────────────────
// Arranque del servidor
// ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
