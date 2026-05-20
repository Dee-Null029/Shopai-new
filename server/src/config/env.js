const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isProd = (process.env.NODE_ENV || 'development') === 'production';
const parseList = (value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);

// Fail fast in production if critical secrets are missing
if (isProd && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}
if (isProd && !process.env.JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_REFRESH_SECRET environment variable is required in production');
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: ['true', '1', 'yes'].includes((process.env.TRUST_PROXY || '').toLowerCase()),
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shopai',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  affiliate: {
    amazon: { tag: process.env.AMAZON_AFFILIATE_TAG },
    flipkart: {
      id: process.env.FLIPKART_AFFILIATE_ID,
      token: process.env.FLIPKART_AFFILIATE_TOKEN,
    },
    myntra: { id: process.env.MYNTRA_AFFILIATE_ID },
  },
  scraping: {
    proxyList: parseList(process.env.PROXY_LIST),
    maxConcurrentScrapes: parseInt(process.env.MAX_CONCURRENT_SCRAPES, 10) || 3,
    maxResultsPerPlatform: parseInt(process.env.MAX_RESULTS_PER_PLATFORM, 10) || 24,
    timeout: parseInt(process.env.SCRAPE_TIMEOUT, 10) || 30000,
  },
};
