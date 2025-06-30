// ✅ Ruta: src/routes/usuarios.js
// 🔐 Rutas protegidas del usuario autenticado – Información mínima y extendida
// 📦 Versión: 1.4 – 29 jun 2025, 3:50 p. m.

const express = require('express');
const router = express.Router();

// ✅ Controladores
const { me, perfil } = require('../controllers/usuariosController');

/* -------------------------------------------------------------------------- */
/* GET /api/me – Datos mínimos desde el JWT                                  */
/* 📌 Devuelve: id, email, is_admin                                           */
/* -------------------------------------------------------------------------- */
router.get('/me', me);

/* -------------------------------------------------------------------------- */
/* GET /api/usuarios/perfil – Datos extendidos desde Supabase                */
/* 📌 Devuelve: first_name, last_name, avatar_url, is_admin                   */
/* -------------------------------------------------------------------------- */
router.get('/usuarios/perfil', perfil);

/* -------------------------------------------------------------------------- */
/* Exportación del router                                                    */
/* -------------------------------------------------------------------------- */
module.exports = router;
