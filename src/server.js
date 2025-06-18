// ✅ src/server.js
// Servidor Principal – Configura Express, rutas, middleware y protección JWT

require('dotenv').config(); // Carga variables de entorno (.env)
const express = require('express');

const authRoutes = require('./routes/authRoutes');               // Login
const usuariosRoutes = require('./routes/usuarios');             // /api/me
const userAdminRoutes = require('./routes/userAdminRoutes');     // Admin: gestión de usuarios
const familiaRoutes = require('./routes/familiaRoutes');         // Admin: familias
const productoRoutes = require('./routes/productoRoutes');       // Admin: productos
const inventarioRoutes = require('./routes/inventarioRoutes');   // Usuario: inventario propio
const movimientoRoutes = require('./routes/movimientoRoutes');   // Usuario: entradas/salidas
const ventaRoutes = require('./routes/ventaRoutes');             // Usuario: ventas
const dashboardRoutes = require('./routes/dashboardRoutes');     // Usuario: dashboard

const { authMiddleware } = require('./middleware/authMiddleware');
const { requireAdmin } = require('./middleware/roleMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global para analizar JSON en todas las peticiones
app.use(express.json());

// Ruta de salud (para comprobar que el backend está corriendo)
app.get('/', (req, res) => {
  res.send('🟢 Servidor funcionando correctamente');
});

// 🟢 Rutas públicas (no requieren autenticación)
app.use('/api', authRoutes); // POST /api/login

// 🔐 Rutas protegidas (requieren JWT válido)
app.use('/api', authMiddleware, usuariosRoutes); // GET /api/me

// 🔐🔒 Rutas protegidas solo para administradores
app.use('/api/usuarios', authMiddleware, requireAdmin, userAdminRoutes);
app.use('/api/familias', authMiddleware, requireAdmin, familiaRoutes);
app.use('/api/productos', authMiddleware, requireAdmin, productoRoutes);

// 🔐 Rutas protegidas para usuarios autenticados (rol usuario o admin)
app.use('/api/inventario', authMiddleware, inventarioRoutes);
app.use('/api/movimientos', authMiddleware, movimientoRoutes);
app.use('/api/ventas', authMiddleware, ventaRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Inicia el servidor en el puerto definido
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
