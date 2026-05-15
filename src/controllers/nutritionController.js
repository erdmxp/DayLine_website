const pool = require('../config/db');

const getEntries = async (req, res) => {
  try {
    const { date } = req.query;

    let result;

    if (date) {
      result = await pool.query(
        `SELECT
          calories_id,
          user_id,
          food_name,
          description,
          food_date,
          grams,
          calories,
          proteins,
          carbs,
          fats,
          to_char(food_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Krasnoyarsk', 'HH24:MI') AS food_date_formatted
        FROM food_history
        WHERE user_id = $1
          AND food_date::date = $2
        ORDER BY food_date DESC`,
        [req.session.userId, date]
      );
    } else {
      result = await pool.query(
        `SELECT
          calories_id,
          user_id,
          food_name,
          description,
          food_date,
          grams,
          calories,
          proteins,
          carbs,
          fats,
          to_char(food_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Krasnoyarsk', 'HH24:MI') AS food_date_formatted
        FROM food_history
        WHERE user_id = $1
        ORDER BY food_date DESC`,
        [req.session.userId]
      );
    }

    res.json(result.rows);
  } catch (e) {
    console.error('GET ENTRIES ERROR:', e);
    res.status(500).send('Ошибка при получении записей');
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT *
       FROM product
       WHERE name_product ILIKE $1
       ORDER BY name_product ASC
       LIMIT 10`,
      [`${q.trim()}%`]
    );

    res.json(result.rows);
  } catch (e) {
    console.error('SEARCH PRODUCTS ERROR:', e);
    res.status(500).send('Ошибка при поиске продуктов');
  }
};

const addEntry = async (req, res) => {
  try {
    const { product_calories_id, grams, food_date } = req.body;

    if (!product_calories_id || !grams || !food_date) {
      return res.status(400).send('Не хватает данных');
    }

    const productResult = await pool.query(
      `SELECT *
       FROM product
       WHERE product_calories_id = $1`,
      [product_calories_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).send('Продукт не найден');
    }

    const product = productResult.rows[0];
    const gramsValue = Number(grams);

    if (!Number.isFinite(gramsValue) || gramsValue <= 0) {
      return res.status(400).send('Граммовка должна быть больше 0');
    }

    const calories = Math.round((Number(product.calories) * gramsValue) / 100);
    const proteins = Math.round((Number(product.proteins) * gramsValue) / 100);
    const carbs = Math.round((Number(product.carbohydrates) * gramsValue) / 100);
    const fats = Math.round((Number(product.fats) * gramsValue) / 100);

    const insertResult = await pool.query(
      `INSERT INTO food_history
        (user_id, food_name, description, food_date, grams, calories, proteins, carbs, fats)
       VALUES ($1, $2, $3, $4::date + CURRENT_TIME, $5, $6, $7, $8, $9)
       RETURNING
         calories_id,
         user_id,
         food_name,
         description,
         food_date,
         grams,
         calories,
         proteins,
         carbs,
         fats,
         to_char(food_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Krasnoyarsk', 'HH24:MI') AS food_date_formatted`,
      [
        req.session.userId,
        product.name_product,
        null,
        food_date,
        gramsValue,
        calories,
        proteins,
        carbs,
        fats
      ]
    );

    res.json(insertResult.rows[0]);
  } catch (e) {
    console.error('ADD ENTRY ERROR:', e);
    res.status(500).send('Ошибка при добавлении продукта');
  }
};

const addRecipeEntry = async (req, res) => {
  try {
    const { dish_id, food_date } = req.body;

    if (!dish_id || !food_date) {
      return res.status(400).send('Не хватает данных');
    }

    const dishResult = await pool.query(
      `SELECT
         d.dish_id,
         d.dish_name,
         COALESCE(SUM(ROUND((p.calories * di.grams) / 100)), 0) AS calories,
         COALESCE(SUM(ROUND((p.proteins * di.grams) / 100)), 0) AS proteins,
         COALESCE(SUM(ROUND((p.carbohydrates * di.grams) / 100)), 0) AS carbs,
         COALESCE(SUM(ROUND((p.fats * di.grams) / 100)), 0) AS fats,
         COALESCE(SUM(di.grams), 0) AS grams
       FROM dish d
       LEFT JOIN dish_ingredients di ON di.dish_id = d.dish_id
       LEFT JOIN product p ON p.product_calories_id = di.product_calories_id
       WHERE d.dish_id = $1 AND d.user_id = $2
       GROUP BY d.dish_id, d.dish_name`,
      [dish_id, req.session.userId]
    );

    if (dishResult.rows.length === 0) {
      return res.status(404).send('Рецепт не найден');
    }

    const ingredientsResult = await pool.query(
      `SELECT
         p.name_product,
         di.grams
       FROM dish_ingredients di
       JOIN dish d ON d.dish_id = di.dish_id
       JOIN product p ON p.product_calories_id = di.product_calories_id
       WHERE di.dish_id = $1 AND d.user_id = $2
       ORDER BY p.name_product ASC`,
      [dish_id, req.session.userId]
    );

    const dish = dishResult.rows[0];

    const description = ingredientsResult.rows
      .map((item) => `${item.name_product} ${item.grams} г`)
      .join(', ');

    const insertResult = await pool.query(
      `INSERT INTO food_history
        (user_id, food_name, description, food_date, grams, calories, proteins, carbs, fats)
       VALUES ($1, $2, $3, $4::date + CURRENT_TIME, $5, $6, $7, $8, $9)
       RETURNING
         calories_id,
         user_id,
         food_name,
         description,
         food_date,
         grams,
         calories,
         proteins,
         carbs,
         fats,
         to_char(food_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Krasnoyarsk', 'HH24:MI') AS food_date_formatted`,
      [
        req.session.userId,
        dish.dish_name,
        description || null,
        food_date,
        Number(dish.grams) || 0,
        Number(dish.calories) || 0,
        Number(dish.proteins) || 0,
        Number(dish.carbs) || 0,
        Number(dish.fats) || 0
      ]
    );

    res.json(insertResult.rows[0]);
  } catch (e) {
    console.error('ADD RECIPE ENTRY ERROR:', e);
    res.status(500).send('Ошибка при добавлении рецепта в рацион');
  }
};

const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM food_history
       WHERE calories_id = $1 AND user_id = $2`,
      [id, req.session.userId]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE ENTRY ERROR:', e);
    res.status(500).send('Ошибка при удалении записи');
  }
};

module.exports = {
  getEntries,
  searchProducts,
  addEntry,
  addRecipeEntry,
  deleteEntry
};
