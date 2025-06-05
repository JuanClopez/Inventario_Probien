// ✅ Servidor Principal - src/server.js
// Configura el servidor Express y conecta las rutas

const express = require('express');
require('dotenv').config(); // Carga variables de entorno
const productoRoutes = require('./routes/productoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para interpretar JSON
app.use(express.json());

// Ruta base para verificar que el servidor está activo
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Rutas para productos
app.use('/api/productos', productoRoutes);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});