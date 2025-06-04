// src/server.js
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON (si lo necesitas)
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
