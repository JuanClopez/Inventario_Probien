// ✅ Servidor Principal - src/server.js
// Configura el servidor Express y conecta las rutas

const express = require('express');
require('dotenv').config(); // Carga variables de entorno
const productoRoutes = require('./routes/productoRoutes');
const familiaRoutes = require('./routes/familiaRoutes'); // ✅ Rutas de familias
// Importa las rutas de productos y familias
// y las integra en el servidor principal
// ✅ Servidor Principal - src/server.js

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
app.use('/api/familias', familiaRoutes); // ✅ Ruta base para familias

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});