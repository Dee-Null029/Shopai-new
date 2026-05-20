const puppeteer = require('puppeteer');
const logger = require('../../middleware/logger');
const config = require('../../config/env');

let browserInstance = null;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

const pickUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

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
  await page.setUserAgent(pickUserAgent());
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-IN,en;q=0.9',
  });
  await page.setViewport({ width: 1920, height: 1080 });
  page.setDefaultNavigationTimeout(config.scraping.timeout);
  page.setDefaultTimeout(config.scraping.timeout);

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const blockedTypes = new Set(['font', 'media']);
    const blockedHosts = [
      'google-analytics.com',
      'googletagmanager.com',
      'doubleclick.net',
      'facebook.net',
    ];
    const url = request.url();
    if (blockedTypes.has(request.resourceType()) || blockedHosts.some(host => url.includes(host))) {
      request.abort().catch(() => {});
    } else {
      request.continue().catch(() => {});
    }
  });

  return page;
};

const safeClose = async (page) => {
  try { if (page) await page.close(); } catch {}
};

const closeBrowser = async () => {
  if (browserInstance?.isConnected()) {
    await browserInstance.close();
  }
  browserInstance = null;
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

const runWithConcurrency = async (items, limit, mapper) => {
  const results = [];
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
};

// Export base utilities first to avoid circular dependency
module.exports = { getBrowser, createPage, safeClose, closeBrowser, withRetry, searchAllPlatforms, scrapeProductDetail };

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
  const requested = options.platforms || ['amazon', 'flipkart', 'myntra'];
  const platforms = [...new Set(requested)].filter(Boolean);
  const s = getScrapers();

  const startedAt = Date.now();
  const results = await runWithConcurrency(
    platforms,
    Math.max(1, config.scraping.maxConcurrentScrapes),
    async (platform) => {
      const scraper = s[platform];
      if (!scraper) {
        logger.warn(`No scraper for platform: ${platform}`);
        return [];
      }
      const platformStartedAt = Date.now();
      const products = await withRetry(() => scraper.search(query, options), 1);
      logger.info(`${platform}: search completed in ${Date.now() - platformStartedAt}ms`);
      return products;
    }
  );

  const allProducts = [];
  results.forEach((result, i) => {
    if (Array.isArray(result)) allProducts.push(...result);
    else logger.error(`Scraper failed for ${platforms[i]}`);
  });

  logger.info(`All platform search completed in ${Date.now() - startedAt}ms with ${allProducts.length} raw products`);
  return allProducts;
}

async function scrapeProductDetail(platform, productId) {
  const s = getScrapers();
  const scraper = s[platform];
  if (!scraper) throw new Error(`No scraper for platform: ${platform}`);
  return withRetry(() => scraper.getProductDetail(productId), 2);
}
