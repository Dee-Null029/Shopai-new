const rateLimit = require('express-rate-limit');

// Conditionally load Redis store - only if Redis is connected and available
let makeStore;
try {
  const { redis } = require('../config/redis');
  const RedisStore = require('rate-limit-redis').default;
  if (redis && redis.status === 'ready') {
    makeStore = (prefix) => new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args) => redis.call(...args),
    });
  }
} catch {
  // Redis not available, use in-memory store
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(makeStore && { store: makeStore('api') }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many auth attempts, please try again later' },
  ...(makeStore && { store: makeStore('auth') }),
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many search requests, please slow down' },
  ...(makeStore && { store: makeStore('search') }),
});

module.exports = { apiLimiter, authLimiter, searchLimiter };
