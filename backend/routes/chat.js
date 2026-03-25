const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const ChatSession = require('../models/ChatSession');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Response cache disabled - always use AI for fresh, detailed responses

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Groq's fastest model (~0.3-0.8s)

// Models to try in order (fastest first)
const OPENROUTER_MODELS = [
  'google/gemma-3n-e2b-it:free',
  'google/gemma-3n-e4b-it:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'meta-llama/llama-3.2-3b-instruct:free'
];

// Instant responses for common questions (removed - using AI for all responses to ensure quality and detail)

// Helper: call AI — Groq first (fastest), fallback to OpenRouter
async function callAI(userMessage) {
  const prompt = `You are EduxBot, a friendly and enthusiastic AI tutor for an e-learning platform. Your goal is to make learning engaging and accessible.

Guidelines:
- Provide detailed, comprehensive explanations (3-5 paragraphs for concept questions)
- Use analogies and real-world examples to make concepts relatable
- Break down complex topics into digestible parts
- Include practical applications and use cases
- Use markdown formatting for better readability (bold, lists, code blocks)
- End with an engaging follow-up question or suggestion
- Be conversational and encouraging
- Use emojis sparingly to add personality

User Question: ${userMessage}`;

  // Try Groq first (sub-1s when available)
  if (GROQ_API_KEY) {
    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.4
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
      return { content: response.data.choices[0].message.content, model: `groq/${GROQ_MODEL}` };
    } catch (err) {
      console.log(`[EduxBot] Groq failed: ${err.message} — falling back to OpenRouter`);
    }
  }

  // Fallback: OpenRouter free models
  let lastError = null;
  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.4
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'EduX',
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      return { content: response.data.choices[0].message.content, model: response.data.model || model };
    } catch (err) {
      console.log(`[EduxBot] OpenRouter model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

// Get sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id, isActive: true })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Chat session not found' });
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create session
router.post('/sessions', auth, [
  body('title').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title = 'New Chat' } = req.body;
    const session = new ChatSession({ user: req.user._id, title, messages: [] });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/sessions/:id/message', auth, [
  body('message').trim().isLength({ min: 1, max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message } = req.body;
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Chat session not found' });

    session.messages.push({ role: 'user', content: message });

    const startTime = Date.now();
    const lowerMessage = message.toLowerCase().trim();

    // Save user message before AI call
    await session.save();

    // AI API call - always fresh responses
    try {
      console.log(`[EduxBot] Calling AI for: ${message.substring(0, 40)}`);
      const { content: botReply, model: usedModel } = await callAI(message);
      const responseTime = Date.now() - startTime;

      // Save to DB (don't await for response speed)
      session.messages.push({ role: 'assistant', content: botReply });
      if (session.messages.length === 2 && session.title === 'New Chat') {
        session.title = message.substring(0, 50);
      }
      session.save().catch(err => console.error('[EduxBot] DB save error:', err));

      const provider = usedModel.startsWith('groq/') ? 'Groq' : 'OpenRouter';
      console.log(`[EduxBot] Response in ${responseTime}ms using ${usedModel}`);
      res.json({ message: botReply, sessionId: session._id, provider, responseTime, model: usedModel });

    } catch (aiError) {
      console.error(`[EduxBot] AI Error: ${aiError.message}`);
      const fallback = "I'm having trouble connecting right now. Please try again in a moment.";
      session.messages.push({ role: 'assistant', content: fallback });
      await session.save();
      res.json({ message: fallback, sessionId: session._id, error: true });
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Chat session not found' });
    session.isActive = false;
    await session.save();
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update title
router.put('/sessions/:id/title', auth, [
  body('title').trim().isLength({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: req.body.title },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Chat session not found' });
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message and regenerate
router.put('/sessions/:id/message/:messageIndex', auth, [
  body('message').trim().isLength({ min: 1, max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message } = req.body;
    const messageIndex = parseInt(req.params.messageIndex);
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) return res.status(404).json({ message: 'Chat session not found' });
    if (messageIndex < 0 || messageIndex >= session.messages.length) return res.status(400).json({ message: 'Invalid message index' });
    if (session.messages[messageIndex].role !== 'user') return res.status(400).json({ message: 'Can only edit user messages' });

    session.messages[messageIndex].content = message;
    session.messages = session.messages.slice(0, messageIndex + 1);
    await session.save();

    const startTime = Date.now();
    const lowerMessage = message.toLowerCase().trim();

    // AI call (no quick responses - using AI for quality)
    try {
      const { content: botReply, model: usedModel } = await callAI(message);
      session.messages.push({ role: 'assistant', content: botReply });
      await session.save();
      res.json({ message: botReply, sessionId: session._id, provider: 'OpenRouter', responseTime: Date.now() - startTime, model: usedModel });
    } catch (aiError) {
      const fallback = "I'm having trouble connecting right now. Please try again.";
      session.messages.push({ role: 'assistant', content: fallback });
      await session.save();
      res.json({ message: fallback, sessionId: session._id, error: true });
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
