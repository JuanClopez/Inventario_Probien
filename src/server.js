// ✅ Servidor Principal - src/server.js
// Configura el servidor Express, carga variables de entorno y conecta rutas

require('dotenv').config(); // Carga variables de entorno (.env)
const express = require('express');

const productoRoutes = require('./routes/productoRoutes');
const familiaRoutes = require('./routes/familiaRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ventaRoutes = require('./routes/ventaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global para analizar JSON en peticiones
app.use(express.json());

// Ruta base (health check)
app.get('/', (req, res) => {
  res.send('🟢 Servidor funcionando correctamente');
});

// Rutas principales
app.use('/api/productos', productoRoutes);
app.use('/api/familias', familiaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ventas', ventaRoutes);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
