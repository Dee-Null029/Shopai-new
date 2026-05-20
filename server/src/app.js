const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const productRoutes = require('./routes/product');
const sentimentRoutes = require('./routes/sentiment');
const rankingRoutes = require('./routes/ranking');
const tryonRoutes = require('./routes/tryon');
const chatRoutes = require('./routes/chat');
const affiliateRoutes = require('./routes/affiliate');

// Chat service for WebSocket
const ChatSession = require('./models/ChatSession');
const { getChatResponse } = require('./services/chatService');

const app = express();
const server = http.createServer(app);

if (config.trustProxy) {
  app.set('trust proxy', 1);
}

const devOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const allowedOrigins = config.nodeEnv === 'production'
  ? config.allowedOrigins
  : [...devOrigins, ...config.allowedOrigins];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/product', productRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/tryon', tryonRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/affiliate', affiliateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ShopAI API is running', timestamp: new Date().toISOString() });
});

// WebSocket chat handler
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.userId}`);

  socket.on('chat:message', async ({ message, sessionId }) => {
    try {
      let session;
      if (sessionId) {
        session = await ChatSession.findOne({ _id: sessionId, userId: socket.userId });
      }
      if (!session) {
        session = await ChatSession.create({
          userId: socket.userId,
          title: message.substring(0, 50),
          messages: [],
        });
      }

      session.messages.push({ role: 'user', content: message });
      socket.emit('chat:typing', { sessionId: session._id });

      const aiResponse = await getChatResponse(session.messages, session.context);

      session.messages.push({
        role: 'assistant',
        content: aiResponse.content,
        productRecommendations: aiResponse.products || [],
      });
      await session.save();

      socket.emit('chat:response', {
        sessionId: session._id,
        message: aiResponse.content,
        products: aiResponse.products || [],
      });
    } catch (err) {
      logger.error(`WebSocket chat error: ${err.message}`);
      socket.emit('chat:error', { error: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.userId}`);
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(() => logger.info('HTTP server closed'));
  io.close(() => logger.info('WebSocket server closed'));
  // Close Puppeteer browser
  try {
    const { closeBrowser } = require('./services/scrapers/baseScraper');
    await closeBrowser();
  } catch {}
  // Close DB
  try { await require('mongoose').connection.close(); } catch {}
  logger.info('Graceful shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const start = async () => {
  await connectDB();
  server.listen(config.port, () => {
    logger.info(`ShopAI server running on port ${config.port} [${config.nodeEnv}]`);
  });
};

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server, io };
