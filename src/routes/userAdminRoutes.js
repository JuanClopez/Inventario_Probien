// ✅ src/routes/userAdminRoutes.js
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin }  = require('../middleware/roleMiddleware');
const {
  getAllUsers,
  createUser
} = require('../controllers/userAdminController');

// Todas las rutas aquí son privadas y solo para administradores
router.use(authMiddleware, requireAdmin);

router.get('/',  getAllUsers); // GET  /api/usuarios
router.post('/', createUser);  // POST /api/usuarios

module.exports = router;
