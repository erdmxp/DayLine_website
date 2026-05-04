// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/registration', authController.register);
router.post('/login', authController.login);
router.get('/main', requireAuth, authController.mainPage);
router.get('/logout', authController.logout);

module.exports = router;