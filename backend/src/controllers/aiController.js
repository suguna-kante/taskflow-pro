require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../db/pool');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in .env');
}

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
});

async function callGemini(systemPrompt, userMessage) {
  const prompt = `
${systemPrompt}

User Input:
${userMessage}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
}

// ── POST /api/ai/suggest-priority ────────────────────────────────
// Given a task title + description, suggest priority + reasoning
exports.suggestPriority = async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });

  try {
    const text = await callGemini(
      `You are a smart task prioritization assistant. Analyse a task and respond ONLY with valid JSON in this exact format:
{"priority":"high"|"medium"|"low","reason":"one sentence explanation","suggested_deadline_days":number_or_null}
No extra text, no markdown, just the JSON object.`,
      `Task title: ${title}\nDescription: ${description}`
    );

    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error('AI suggest-priority error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/ai/breakdown ────────────────────────────────────────
// Break a task into subtasks / steps
exports.breakdown = async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });

  try {
    const text = await callGemini(
      `You are a project planning assistant. Break a task into actionable subtasks. 
Respond ONLY with valid JSON:
{"subtasks":["step 1","step 2",...],"estimated_hours":number,"notes":"optional short tip"}
No markdown, no extra text.`,
      `Task: ${title}\nDetails: ${description}`
    );

    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error('AI breakdown error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/ai/improve-description ─────────────────────────────
// Improve a task description for clarity
exports.improveDescription = async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });

  try {
    const text = await callGemini(
      `You are a technical writing assistant. Improve a task description to be clear and actionable.
Respond ONLY with valid JSON:
{"improved_description":"the better description","changes_made":"brief summary of what you improved"}
No markdown, no extra text.`,
      `Title: ${title}\nCurrent description: ${description || '(empty)'}`
    );

    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error('AI improve-description error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/ai/daily-summary ─────────────────────────────────────
// Summarise the user's tasks and give today's focus recommendation
exports.dailySummary = async (req, res) => {
  try {
    const { rows: tasks } = await pool.query(
      `SELECT title, status, priority, deadline
       FROM tasks WHERE owner_id=$1 AND status != 'done'
       ORDER BY priority, deadline NULLS LAST LIMIT 20`,
      [req.user.id]
    );

    if (!tasks.length) {
      return res.json({
        summary: "You have no pending tasks. Great work! 🎉",
        focus_tasks: [],
        motivation: "Keep up the excellent pace!"
      });
    }

    const taskList = tasks.map(t =>
      `- "${t.title}" [${t.priority} priority, status: ${t.status}${t.deadline ? `, due: ${t.deadline.toISOString().slice(0,10)}` : ''}]`
    ).join('\n');

    const text = await callGemini(
      `You are a productivity coach. Analyse a user's pending tasks and give actionable daily guidance.
Respond ONLY with valid JSON:
{"summary":"2-3 sentence overview","focus_tasks":["task 1","task 2","task 3"],"motivation":"one encouraging sentence","warning":"overdue or urgent note or null"}
No markdown, no extra text.`,
      `Today's pending tasks:\n${taskList}`
    );

    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (err) {
    console.error('AI daily-summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/ai/chat ─────────────────────────────────────────────
// General task assistant chat — fully powered by Gemini
exports.chat = async (req, res) => {
  const { message, context = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required.' });

  try {
    // Fetch a snapshot of user's tasks for context
    const { rows: tasks } = await pool.query(
      `SELECT title, status, priority, deadline
       FROM tasks WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 15`,
      [req.user.id]
    );

    const taskSnapshot = tasks.length
      ? tasks.map(t =>
          `"${t.title}" [${t.status}, ${t.priority}${t.deadline ? `, due ${t.deadline.toISOString().slice(0,10)}` : ''}]`
        ).join('\n')
      : '(no tasks yet)';

    // Build conversation history as plain text for Gemini
    const history = context
      .slice(-6) // last 3 turns (user + assistant pairs)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a helpful AI task management assistant. The user's current tasks:
${taskSnapshot}

Be concise, practical, and friendly. Help with task planning, prioritisation, and productivity.`;

    const fullMessage = history
      ? `${history}\nUser: ${message}`
      : message;

    const text = await callGemini(systemPrompt, fullMessage);

    res.json({ reply: text.trim() });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
};