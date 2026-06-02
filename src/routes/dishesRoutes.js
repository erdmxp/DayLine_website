const express = require('express');
const router = express.Router();

const dishesController = require('../controllers/dishesController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, dishesController.getDishes);
router.get('/:id', requireAuth, dishesController.getDishById);
router.post('/', requireAuth, dishesController.createDish);
router.put('/:id', requireAuth, dishesController.updateDish);
router.delete('/:id', requireAuth, dishesController.deleteDish);

module.exports = router;
