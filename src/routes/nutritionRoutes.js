const express = require('express');
const router = express.Router();

const nutritionController = require('../controllers/nutritionController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/products/search', requireAuth, nutritionController.searchProducts);
router.get('/', requireAuth, nutritionController.getEntries);
router.post('/', requireAuth, nutritionController.addEntry);
router.post('/recipe-entry', requireAuth, nutritionController.addRecipeEntry);
router.delete('/:id', requireAuth, nutritionController.deleteEntry);

module.exports = router;
