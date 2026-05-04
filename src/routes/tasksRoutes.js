const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { getTasks, addTask, updateTask, deleteTask } = require('../controllers/tasksController');

router.get('/',        requireAuth, getTasks);
router.post('/',       requireAuth, addTask);
router.patch('/:id',   requireAuth, updateTask);
router.delete('/:id',  requireAuth, deleteTask);

module.exports = router;