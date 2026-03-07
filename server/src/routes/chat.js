const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');
const { getChatResponse } = require('../services/chatService');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    sessionId: z.string().optional(),
  }),
});

// Get all chat sessions for user
router.get('/sessions', auth, async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
});

// Get a specific session with messages
router.get('/sessions/:sessionId', auth, async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, userId: req.user.id });
    if (!session) return next(new AppError('Session not found', 404));
    res.json({ success: true, data: session });
  } catch (err) { next(err); }
});

// Send a message (REST fallback — WebSocket is primary)
router.post('/message', auth, validate(chatSchema), async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id });
      if (!session) return next(new AppError('Session not found', 404));
    } else {
      session = await ChatSession.create({
        userId: req.user.id,
        title: message.substring(0, 50),
        messages: [],
      });
    }

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Get AI response
    const aiResponse = await getChatResponse(session.messages, session.context);

    // Add assistant message
    session.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      productRecommendations: aiResponse.products || [],
    });

    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        message: aiResponse.content,
        products: aiResponse.products || [],
      },
    });
  } catch (err) { next(err); }
});

// Delete a session
router.delete('/sessions/:sessionId', auth, async (req, res, next) => {
  try {
    const result = await ChatSession.deleteOne({ _id: req.params.sessionId, userId: req.user.id });
    if (result.deletedCount === 0) return next(new AppError('Session not found', 404));
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
