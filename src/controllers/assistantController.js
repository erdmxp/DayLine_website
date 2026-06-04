const cleanTasks = (items) => {
  if (!Array.isArray(items)) return [];
  return [...new Set(items
    .map(item => typeof item === 'string' ? item : item?.title)
    .map(item => String(item || '').trim().replace(/^[-–—\d.)\s]+/, ''))
    .filter(Boolean)
    .map(item => item.slice(0, 80))
  )].slice(0, 8);
};

const createFallbackPlan = (goal) => {
  const text = goal.trim().replace(/[.!?]+$/, '');
  const lower = text.toLowerCase();

  if (/экзамен|зач[её]т|учеб|курсов|диплом/.test(lower)) {
    return [
      `Собрать требования и материалы: ${text}`,
      'Разделить материал на небольшие темы',
      'Изучить первую тему и сделать конспект',
      'Выполнить практическое задание',
      'Проверить пробелы и повторить сложное',
      'Провести итоговую самопроверку'
    ];
  }

  if (/сайт|проект|приложен|разработ/.test(lower)) {
    return [
      `Уточнить результат и критерии готовности: ${text}`,
      'Составить список необходимых функций',
      'Сделать основной пользовательский сценарий',
      'Проверить работу на телефоне и компьютере',
      'Исправить найденные ошибки',
      'Подготовить финальную версию к публикации'
    ];
  }

  return [
    `Определить конкретный результат: ${text}`,
    'Подготовить всё необходимое для начала',
    'Сделать первый небольшой шаг',
    'Выполнить основную часть работы',
    'Проверить результат и исправить недочёты',
    'Зафиксировать итог и следующий шаг'
  ];
};

const generatePlan = async (req, res) => {
  const goal = typeof req.body.goal === 'string' ? req.body.goal.trim() : '';
  if (goal.length < 3 || goal.length > 500) {
    return res.status(400).json({ error: 'Опишите цель текстом от 3 до 500 символов' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.json({ tasks: createFallbackPlan(goal), source: 'local' });
  }

  try {
    const response = await fetch(`${process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://day-line.ru',
        'X-Title': 'DayLine'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'openrouter/free',
        temperature: 0.35,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: 'Ты помощник планировщика DayLine. Разбей цель на 4-8 конкретных коротких задач на русском языке. Каждая задача должна начинаться с глагола и быть выполнимой. Верни только JSON вида {"tasks":["задача"]}, без Markdown.'
          },
          { role: 'user', content: goal }
        ]
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim());
    const tasks = cleanTasks(parsed.tasks);
    if (tasks.length < 2) throw new Error('AI вернул некорректный план');
    return res.json({ tasks, source: 'ai' });
  } catch (error) {
    console.error('Ошибка AI-планировщика:', error.message);
    return res.json({ tasks: createFallbackPlan(goal), source: 'fallback' });
  }
};

module.exports = { generatePlan, createFallbackPlan, cleanTasks };
