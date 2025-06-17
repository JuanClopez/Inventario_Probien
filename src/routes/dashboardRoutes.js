// ✅ src/routes/dashboardRoutes.js
const express = require('express');
const { obtenerResumenUsuario } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard?user_id=...
router.get('/', obtenerResumenUsuario);

module.exports = router;