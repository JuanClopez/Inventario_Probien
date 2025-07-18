// ✅ src/routes/authRoutes.js
const express = require('express');
const { login } = require('../controllers/authController');

const router = express.Router();

// Login público
router.post('/login', login);

module.exports = router;
