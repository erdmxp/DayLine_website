const cleanTasks = (items) => {
  if (!Array.isArray(items)) return [];
  return [...new Set(items
    .map(item => typeof item === 'string' ? item : item?.title)
    .map(item => String(item || '').trim().replace(/^[-–—\d.)\s]+/, ''))
    .filter(Boolean)
    .map(item => item.slice(0, 80))
  )].slice(0, 8);
};

const containsBlockedContent = (text) => {
  const normalized = text.toLowerCase().replace(/ё/g, 'е');
  return /(бля|хуй|пизд|еба|ебл|сука|мудак)/i.test(normalized);
};

const parseAssistantResponse = (content) => {
  const clean = String(content || '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(clean);
  return {
    message: String(parsed.message || '').trim().slice(0, 700),
    tasks: cleanTasks(parsed.tasks)
  };
};

const generatePlan = async (req, res) => {
  const message = typeof req.body.message === 'string'
    ? req.body.message.trim()
    : typeof req.body.goal === 'string' ? req.body.goal.trim() : '';
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-6) : [];

  if (message.length < 2 || message.length > 500) {
    return res.status(400).json({ error: 'Напишите сообщение длиной от 2 до 500 символов' });
  }
  if (containsBlockedContent(message)) {
    return res.status(400).json({ error: 'Запрос содержит нецензурную лексику. Переформулируйте его спокойнее.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ИИ-помощник пока не настроен. Добавьте OPENROUTER_API_KEY в Render.' });
  }

  const safeHistory = history
    .filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .map(item => ({ role: item.role, content: item.content.slice(0, 700) }));

  try {
    const response = await fetch(`${process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://day-line.ru',
        'X-Title': 'DayLine'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'openrouter/free',
        temperature: 0.65,
        max_tokens: 650,
        messages: [
          {
            role: 'system',
            content: 'Ты дружелюбный помощник DayLine по планированию. Веди короткий диалог на русском: если цель расплывчатая, задай один уточняющий вопрос и верни пустой массив tasks. Если информации достаточно, предложи 3-7 конкретных коротких задач. Не обсуждай опасные, незаконные или оскорбительные запросы. Отвечай строго JSON: {"message":"короткий ответ","tasks":["задача"]}. Без Markdown.'
          },
          ...safeHistory,
          { role: 'user', content: message }
        ]
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
    const data = await response.json();
    const result = parseAssistantResponse(data.choices?.[0]?.message?.content);
    if (!result.message) throw new Error('Пустой ответ модели');
    return res.json(result);
  } catch (error) {
    console.error('Ошибка AI-помощника:', error.message);
    return res.status(502).json({ error: 'ИИ сейчас не смог ответить. Попробуйте ещё раз через минуту.' });
  }
};

module.exports = { generatePlan, cleanTasks, containsBlockedContent, parseAssistantResponse };
