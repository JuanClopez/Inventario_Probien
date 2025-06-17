// ✅ src/server.js
// Servidor Principal – Configura Express, rutas, middleware y protección JWT

require('dotenv').config(); // Carga variables de entorno (.env)
const express = require('express');

const productoRoutes = require('./routes/productoRoutes');
const familiaRoutes = require('./routes/familiaRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuarios');

const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global para analizar JSON
app.use(express.json());

// Ruta de salud (verifica que el backend responde)
app.get('/', (req, res) => {
  res.send('🟢 Servidor funcionando correctamente');
});

// Rutas públicas (no requieren token)
app.use('/api', authRoutes); // POST /api/login

// Rutas privadas (requieren token JWT)
app.use('/api/familias', authMiddleware, familiaRoutes);
app.use('/api/productos', authMiddleware, productoRoutes);
app.use('/api/inventario', authMiddleware, inventarioRoutes);
app.use('/api/movimientos', authMiddleware, movimientoRoutes);
app.use('/api/ventas', authMiddleware, ventaRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api', usuariosRoutes);

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
