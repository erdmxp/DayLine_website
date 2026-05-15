const pool = require('../config/db');

const getTransactions = async (req, res) => {
  try {
    const { month, category, type } = req.query;

    let query = `
      SELECT
        transaction_id,
        user_id,
        type,
        category,
        date,
        amount,
        description,
        to_char(date, 'DD.MM.YYYY') AS date_formatted
      FROM wallet
      WHERE user_id = $1
    `;

    const params = [req.session.userId];
    let paramIndex = 2;

    if (month) {
      query += ` AND to_char(date, 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY date DESC, transaction_id DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (e) {
    console.error('GET TRANSACTIONS ERROR:', e);
    res.status(500).send('Ошибка при получении операций');
  }
};

const getSummary = async (req, res) => {
  try {
    const { month, category, type } = req.query;

    let where = `WHERE user_id = $1`;
    const params = [req.session.userId];
    let paramIndex = 2;

    if (month) {
      where += ` AND to_char(date, 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (category) {
      where += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (type) {
      where += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense,
        COALESCE(SUM(
          CASE
            WHEN type = 'income' THEN amount
            ELSE -amount
          END
        ), 0) AS balance
      FROM wallet
      ${where}
      `,
      params
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error('GET SUMMARY ERROR:', e);
    res.status(500).send('Ошибка при получении итогов');
  }
};

const addTransaction = async (req, res) => {
  try {
    const { type, category, date, amount, description } = req.body;

    if (!type || !category || !date || !amount) {
      return res.status(400).send('Не хватает данных');
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).send('Некорректный тип операции');
    }

    const amountValue = Number(amount);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return res.status(400).send('Некорректная сумма');
    }

    const result = await pool.query(
      `
      INSERT INTO wallet (user_id, type, category, date, amount, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        transaction_id,
        user_id,
        type,
        category,
        date,
        amount,
        description,
        to_char(date, 'DD.MM.YYYY') AS date_formatted
      `,
      [
        req.session.userId,
        type,
        category,
        date,
        amountValue,
        description || null
      ]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error('ADD TRANSACTION ERROR:', e);
    res.status(500).send('Ошибка при добавлении операции');
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM wallet
      WHERE transaction_id = $1 AND user_id = $2
      `,
      [id, req.session.userId]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE TRANSACTION ERROR:', e);
    res.status(500).send('Ошибка при удалении операции');
  }
};

module.exports = {
  getTransactions,
  getSummary,
  addTransaction,
  deleteTransaction
};
