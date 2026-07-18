const express = require('express');
const path = require('path');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth, requirePageAuth } = require('../middleware/authMiddleware');

router.get('/autorisation', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/autorisation.html'));
});
router.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/registration.html'));
});

router.post('/registration', authController.register);
router.post('/login', authController.login);
router.get('/api/session', requireAuth, authController.sessionInfo);
router.post('/api/logout', requireAuth, authController.logoutApi);
router.get('/main', requirePageAuth, authController.mainPage);
router.get('/logout', authController.logout);

module.exports = router;
