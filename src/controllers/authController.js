// src/controllers/authController.js
const pool = require('../config/db');          
const bcrypt = require('bcrypt');
const path = require('path');

const register = async (req, res) => {
  try {
    const { nickname, email, password } = req.body;
    const normalizedNickname = nickname?.trim();

    if (!normalizedNickname || !email || !password) {
      return res.status(400).send('Заполните все поля');
    }

    if (normalizedNickname.length < 3) {
      return res.status(400).send('Ник должен содержать не менее 3 символов');
    }

    const userExists = await pool.query(
      'SELECT user_id FROM "user" WHERE nickname = $1 OR email = $2',
      [normalizedNickname, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).send('Пользователь с таким ником или почтой уже существует');
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO "user" (nickname, email, hash_password)
      VALUES ($1, $2, $3)
      RETURNING user_id, nickname, email
      `,
      [normalizedNickname, email, hash]
    );

    const newUser = result.rows[0];

    req.session.userId = newUser.user_id;
    req.session.user = {
      id: newUser.user_id,
      nickname: newUser.nickname,
      email: newUser.email
    };

    req.session.save((sessionError) => {
      if (sessionError) {
        console.error('SESSION SAVE ERROR:', sessionError);
        return res.status(500).send('Ошибка сервера');
      }

      res.status(201).json({
        ok: true,
        user: req.session.user
      });
    });
  } catch (error) {
    console.log('REGISTER ERROR:', error);
    res.status(500).send('Ошибка сервера');
  }
};

const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).send('Введите ник/почту и пароль');
    }

    const result = await pool.query(
      `
      SELECT user_id, nickname, email, hash_password
      FROM "user"
      WHERE nickname = $1 OR email = $1
      `,
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(400).send('Пользователь не найден');
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.hash_password);

    if (!isMatch) {
      return res.status(400).send('Неверный пароль');
    }

    req.session.userId = user.user_id;
    req.session.user = {
      id: user.user_id,
      nickname: user.nickname,
      email: user.email
    };

    req.session.save((sessionError) => {
      if (sessionError) {
        console.error('SESSION SAVE ERROR:', sessionError);
        return res.status(500).send('Ошибка сервера');
      }

      res.status(200).json({
        ok: true,
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).send('Ошибка сервера');
  }
};

const mainPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/main.html'));
};

const sessionInfo = (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: req.session.user || { id: req.session.userId }
  });
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('dayline.sid');
    res.redirect('/autorisation.html');
  });
};

const logoutApi = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('SESSION DESTROY ERROR:', error);
      return res.status(500).json({ ok: false, error: 'Не удалось завершить сессию' });
    }

    res.clearCookie('dayline.sid');
    res.status(200).json({ ok: true });
  });
};

module.exports = {
  register,
  login,
  mainPage,
  sessionInfo,
  logout,
  logoutApi
};
