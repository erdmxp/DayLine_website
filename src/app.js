require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const dishesRoutes = require('./routes/dishesRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dayline-local-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use('/image', express.static(path.join(__dirname, '../image')));

app.use('/api/tasks', tasksRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/wallet', walletRoutes);
app.use(authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;
