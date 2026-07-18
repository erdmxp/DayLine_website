const pool = require('../config/db');

const createFeedback = async (req, res) => {
  try {
    const { type, message } = req.body;
    const cleanMessage = String(message || '').trim();
    const allowedTypes = ['problem', 'suggestion'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).send('Выберите тип обращения');
    }

    if (cleanMessage.length < 5 || cleanMessage.length > 2000) {
      return res.status(400).send('Описание должно содержать от 5 до 2000 символов');
    }

    const result = await pool.query(
      `INSERT INTO feedback (user_id, type, message)
       VALUES ($1, $2, $3)
       RETURNING feedback_id, type, message, created_at`,
      [req.session.userId, type, cleanMessage]
    );

    res.status(201).json({ ok: true, feedback: result.rows[0] });
  } catch (error) {
    console.error('CREATE FEEDBACK ERROR:', error);
    res.status(500).send('Не удалось сохранить обратную связь');
  }
};

module.exports = { createFeedback };
