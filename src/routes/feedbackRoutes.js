const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createFeedback } = require('../controllers/feedbackController');

const router = express.Router();

router.post('/', requireAuth, createFeedback);

module.exports = router;
