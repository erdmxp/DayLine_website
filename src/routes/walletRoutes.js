const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');
const {
  getTransactions,
  getSummary,
  addTransaction,
  deleteTransaction
} = require('../controllers/walletController');

router.get('/', requireAuth, getTransactions);
router.get('/summary', requireAuth, getSummary);
router.post('/', requireAuth, addTransaction);
router.delete('/:id', requireAuth, deleteTransaction);

module.exports = router;