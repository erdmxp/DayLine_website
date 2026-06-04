const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanTasks, containsBlockedContent, parseAssistantResponse } = require('../src/controllers/assistantController');

test('очистка ответа удаляет дубли и ограничивает число задач', () => {
  const tasks = cleanTasks(['1. Начать', 'Начать', ...Array.from({ length: 10 }, (_, i) => `Шаг ${i}`)]);
  assert.equal(new Set(tasks).size, tasks.length);
  assert.ok(tasks.length <= 8);
});

test('нецензурный запрос отклоняется до обращения к API', () => {
  assert.equal(containsBlockedContent('нормальная учебная цель'), false);
  assert.equal(containsBlockedContent('бля сделай что-нибудь'), true);
});

test('структурированный ответ чата разбирается безопасно', () => {
  const result = parseAssistantResponse('{"message":"Вот идеи","tasks":["Собрать материалы","Сделать черновик"]}');
  assert.equal(result.message, 'Вот идеи');
  assert.deepEqual(result.tasks, ['Собрать материалы', 'Сделать черновик']);
});
