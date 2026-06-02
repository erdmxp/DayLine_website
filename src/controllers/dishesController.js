const pool = require('../config/db');

const getDishes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        d.dish_id,
        d.user_id,
        d.dish_name,
        COALESCE(SUM(ROUND((p.calories * di.grams) / 100)), 0) AS calories,
        COALESCE(SUM(ROUND((p.proteins * di.grams) / 100)), 0) AS proteins,
        COALESCE(SUM(ROUND((p.carbohydrates * di.grams) / 100)), 0) AS carbs,
        COALESCE(SUM(ROUND((p.fats * di.grams) / 100)), 0) AS fats,
        COUNT(di.dish_ingredient_id) AS ingredients_count
      FROM dish d
      LEFT JOIN dish_ingredients di ON di.dish_id = d.dish_id
      LEFT JOIN product p ON p.product_calories_id = di.product_calories_id
      WHERE d.user_id = $1
      GROUP BY d.dish_id, d.user_id, d.dish_name
      ORDER BY d.dish_name ASC`,
      [req.session.userId]
    );

    res.json(result.rows);
  } catch (e) {
    console.error('GET DISHES ERROR:', e);
    res.status(500).send('Ошибка при получении рецептов');
  }
};

const getDishById = async (req, res) => {
  try {
    const { id } = req.params;

    const dishResult = await pool.query(
      `SELECT
        d.dish_id,
        d.user_id,
        d.dish_name,
        COALESCE(SUM(ROUND((p.calories * di.grams) / 100)), 0) AS calories,
        COALESCE(SUM(ROUND((p.proteins * di.grams) / 100)), 0) AS proteins,
        COALESCE(SUM(ROUND((p.carbohydrates * di.grams) / 100)), 0) AS carbs,
        COALESCE(SUM(ROUND((p.fats * di.grams) / 100)), 0) AS fats
      FROM dish d
      LEFT JOIN dish_ingredients di ON di.dish_id = d.dish_id
      LEFT JOIN product p ON p.product_calories_id = di.product_calories_id
      WHERE d.dish_id = $1 AND d.user_id = $2
      GROUP BY d.dish_id, d.user_id, d.dish_name`,
      [id, req.session.userId]
    );

    if (dishResult.rows.length === 0) {
      return res.status(404).send('Рецепт не найден');
    }

    const ingredientsResult = await pool.query(
      `SELECT
        di.dish_ingredient_id,
        di.dish_id,
        di.product_calories_id,
        di.grams,
        p.name_product,
        ROUND((p.calories * di.grams) / 100) AS calories,
        ROUND((p.proteins * di.grams) / 100) AS proteins,
        ROUND((p.carbohydrates * di.grams) / 100) AS carbs,
        ROUND((p.fats * di.grams) / 100) AS fats
      FROM dish_ingredients di
      JOIN dish d ON d.dish_id = di.dish_id
      JOIN product p ON p.product_calories_id = di.product_calories_id
      WHERE di.dish_id = $1 AND d.user_id = $2
      ORDER BY di.dish_ingredient_id ASC`,
      [id, req.session.userId]
    );

    res.json({
      ...dishResult.rows[0],
      ingredients: ingredientsResult.rows
    });
  } catch (e) {
    console.error('GET DISH BY ID ERROR:', e);
    res.status(500).send('Ошибка при получении рецепта');
  }
};

const createDish = async (req, res) => {
  const client = await pool.connect();

  try {
    const { dish_name, ingredients } = req.body;

    if (!dish_name || !dish_name.trim()) {
      return res.status(400).send('Название рецепта обязательно');
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).send('Нужен хотя бы один ингредиент');
    }

    for (const item of ingredients) {
      if (!item.product_calories_id || !item.grams) {
        return res.status(400).send('Некорректные данные ингредиентов');
      }

      if (Number(item.grams) <= 0) {
        return res.status(400).send('Граммовка должна быть больше 0');
      }
    }

    await client.query('BEGIN');

    const dishInsertResult = await client.query(
      `INSERT INTO dish (user_id, dish_name)
       VALUES ($1, $2)
       RETURNING dish_id, user_id, dish_name`,
      [req.session.userId, dish_name.trim()]
    );

    const dish = dishInsertResult.rows[0];

    for (const item of ingredients) {
      const productResult = await client.query(
        `SELECT product_calories_id
         FROM product
         WHERE product_calories_id = $1`,
        [item.product_calories_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).send(`Продукт с id ${item.product_calories_id} не найден`);
      }

      await client.query(
        `INSERT INTO dish_ingredients (dish_id, product_calories_id, grams)
         VALUES ($1, $2, $3)`,
        [dish.dish_id, item.product_calories_id, Number(item.grams)]
      );
    }

    await client.query('COMMIT');

    res.json({
      ok: true,
      dish_id: dish.dish_id
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('CREATE DISH ERROR:', e);
    res.status(500).send('Ошибка при создании рецепта');
  } finally {
    client.release();
  }
};

const updateDish = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { dish_name, ingredients } = req.body;

    if (!dish_name || !dish_name.trim()) {
      return res.status(400).send('Название рецепта обязательно');
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).send('Нужен хотя бы один ингредиент');
    }

    const checkResult = await client.query(
      `SELECT dish_id
       FROM dish
       WHERE dish_id = $1 AND user_id = $2`,
      [id, req.session.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).send('Рецепт не найден');
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE dish
       SET dish_name = $1
       WHERE dish_id = $2 AND user_id = $3`,
      [dish_name.trim(), id, req.session.userId]
    );

    await client.query(
      `DELETE FROM dish_ingredients
       WHERE dish_id = $1`,
      [id]
    );

    for (const item of ingredients) {
      await client.query(
        `INSERT INTO dish_ingredients (dish_id, product_calories_id, grams)
         VALUES ($1, $2, $3)`,
        [id, item.product_calories_id, Number(item.grams)]
      );
    }

    await client.query('COMMIT');

    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('UPDATE DISH ERROR:', e);
    res.status(500).send('Ошибка при обновлении рецепта');
  } finally {
    client.release();
  }
};

const deleteDish = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const checkResult = await client.query(
      `SELECT dish_id
       FROM dish
       WHERE dish_id = $1 AND user_id = $2`,
      [id, req.session.userId]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send('Рецепт не найден');
    }

    await client.query(
      `DELETE FROM dish_ingredients
       WHERE dish_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM dish
       WHERE dish_id = $1 AND user_id = $2`,
      [id, req.session.userId]
    );

    await client.query('COMMIT');

    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('DELETE DISH ERROR:', e);
    res.status(500).send('Ошибка при удалении рецепта');
  } finally {
    client.release();
  }
};

module.exports = {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish
};
