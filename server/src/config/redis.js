const Redis = require('ioredis');
const config = require('./env');
const logger = require('../middleware/logger');

let redis;

try {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis: max retries reached, running without cache');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));
} catch (err) {
  logger.warn('Redis unavailable, running without cache');
  redis = null;
}

const cache = {
  async get(key) {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  async set(key, value, ttlSeconds = 900) {
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // silently fail
    }
  },
  async del(key) {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {
      // silently fail
    }
  },
};

module.exports = { redis, cache };
