const test = require('node:test');
const assert = require('node:assert/strict');
const { createFallbackPlan, cleanTasks } = require('../src/controllers/assistantController');

test('резервный план содержит конкретные короткие задачи', () => {
  const tasks = createFallbackPlan('подготовиться к защите проекта');
  assert.ok(tasks.length >= 4 && tasks.length <= 8);
  assert.ok(tasks.every(task => task.length > 3 && task.length <= 80));
});

test('очистка ответа удаляет дубли и ограничивает число задач', () => {
  const tasks = cleanTasks(['1. Начать', 'Начать', ...Array.from({ length: 10 }, (_, i) => `Шаг ${i}`)]);
  assert.equal(new Set(tasks).size, tasks.length);
  assert.ok(tasks.length <= 8);
});
