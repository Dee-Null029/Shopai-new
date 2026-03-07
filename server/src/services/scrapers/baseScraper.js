const puppeteer = require('puppeteer');
const logger = require('../../middleware/logger');
const config = require('../../config/env');

let browserInstance = null;

const getBrowser = async () => {
  if (!browserInstance || !browserInstance.isConnected()) {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    };
    // Use system Chromium in Docker/production
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browserInstance = await puppeteer.launch(launchOptions);
  }
  return browserInstance;
};

const createPage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });
  page.setDefaultNavigationTimeout(config.scraping.timeout);
  return page;
};

const safeClose = async (page) => {
  try { if (page) await page.close(); } catch {}
};

const withRetry = async (fn, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      logger.warn(`Retry ${i + 1}/${retries}: ${err.message}`);
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
};

// Export base utilities first to avoid circular dependency
module.exports = { getBrowser, createPage, safeClose, withRetry, searchAllPlatforms, scrapeProductDetail };

// Lazy-load platform scrapers (required AFTER exports to break circular dependency)
let scrapers = null;
function getScrapers() {
  if (!scrapers) {
    scrapers = {
      amazon: require('./amazonScraper'),
      flipkart: require('./flipkartScraper'),
      myntra: require('./myntraScraper'),
    };
  }
  return scrapers;
}

async function searchAllPlatforms(query, options = {}) {
  const platforms = options.platforms || ['amazon', 'flipkart', 'myntra'];
  const s = getScrapers();

  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const scraper = s[platform];
      if (!scraper) {
        logger.warn(`No scraper for platform: ${platform}`);
        return [];
      }
      return withRetry(() => scraper.search(query, options), 1);
    })
  );

  const allProducts = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allProducts.push(...result.value);
    } else {
      logger.error(`Scraper failed for ${platforms[i]}: ${result.reason?.message}`);
    }
  });

  return allProducts;
}

async function scrapeProductDetail(platform, productId) {
  const s = getScrapers();
  const scraper = s[platform];
  if (!scraper) throw new Error(`No scraper for platform: ${platform}`);
  return withRetry(() => scraper.getProductDetail(productId), 2);
}
