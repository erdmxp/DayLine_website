const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { generatePlan } = require('../controllers/assistantController');

const router = express.Router();
router.post('/plan', requireAuth, generatePlan);

module.exports = router;
