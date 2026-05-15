const pool = require('../config/db');

const getTasks = async (req, res) => {
    try {
        const { date } = req.query; // ?date=2026-05-07
        let result;
        if (date) {
            result = await pool.query(
                'SELECT * FROM tasks WHERE user_id = $1 AND data_tasks = $2 ORDER BY tasks_id ASC',
                [req.session.userId, date]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM tasks WHERE user_id = $1 ORDER BY data_tasks ASC',
                [req.session.userId]
            );
        }
        res.json(result.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

const addTask = async (req, res) => {
    try {
        const { tasks, data_tasks } = req.body;
        const taskText = typeof tasks === 'string' ? tasks.trim() : '';

        if (!taskText) {
            return res.status(400).json({ error: 'Введите текст задачи' });
        }

        const date = data_tasks || new Date().toISOString().split('T')[0];
        const result = await pool.query(
            'INSERT INTO tasks (user_id, tasks, data_tasks) VALUES ($1, $2, $3::date) RETURNING *',
            [req.session.userId, taskText, date]
        );
        res.json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { tasks } = req.body;
        const taskText = typeof tasks === 'string' ? tasks.trim() : '';

        if (!taskText) {
            return res.status(400).json({ error: 'Введите текст задачи' });
        }

        const result = await pool.query(
            'UPDATE tasks SET tasks = $1 WHERE tasks_id = $2 AND user_id = $3 RETURNING *',
            [taskText, id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }

        res.json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            'DELETE FROM tasks WHERE tasks_id = $1 AND user_id = $2',
            [id, req.session.userId]
        );
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};



module.exports = { getTasks, addTask, updateTask, deleteTask };
