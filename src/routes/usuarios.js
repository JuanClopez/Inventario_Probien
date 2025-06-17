// ✅ src/routes/usuarios.js
// Rutas relacionadas con el usuario autenticado

const express = require('express');
const router = express.Router();

// Importamos el controlador y el middleware
const { me } = require('../controllers/usuariosController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/me
 * @desc    Retorna información del usuario autenticado
 * @access  Privado (requiere token válido)
 */
router.get('/me', authMiddleware, me);

module.exports = router;
