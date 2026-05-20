const { createPage, safeClose } = require('./baseScraper');
const logger = require('../../middleware/logger');
const config = require('../../config/env');
const { waitForAnySelector } = require('./scraperUtils');

const FLIPKART_BASE = 'https://www.flipkart.com';

const search = async (query, options = {}) => {
  const page = await createPage();
  try {
    const url = `${FLIPKART_BASE}/search?q=${encodeURIComponent(query)}&page=${options.page || 1}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitForAnySelector(page, ['[data-id]', '._1YokD2', '._75nlfW'], 12000);

    // Close login popup if present
    try {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        const closeBtn = Array.from(btns).find(b => b.textContent.trim() === '✕');
        if (closeBtn) closeBtn.click();
      });
    } catch {}

    const products = await page.evaluate((limit) => {
      const items = document.querySelectorAll('[data-id]');
      return Array.from(items).slice(0, limit).map(item => {
        const dataId = item.getAttribute('data-id');
        if (!dataId) return null;

        const link = item.querySelector('a[href*="/p/"]');
        const href = link ? link.getAttribute('href') : null;
        if (!href) return null;

        const img = item.querySelector('img');
        const sponsored = /sponsored/i.test(item.textContent || '');

        // Extract leaf text nodes (elements with no child elements)
        const leafTexts = [];
        item.querySelectorAll('*').forEach(el => {
          if (el.children.length === 0) {
            const t = el.textContent.trim();
            if (t && t.length > 1 && t.length < 200) leafTexts.push(t);
          }
        });

        // Filter out junk leaf texts
        const cleanTexts = leafTexts.filter(t =>
          !t.startsWith('Add to Compare') &&
          !t.startsWith('Sponsored') &&
          !t.startsWith('Currently unavailable') &&
          !t.startsWith('Price: Not Available') &&
          !/^\d+\s*Ratings?$/i.test(t) &&
          !/^\d+\s*Reviews?$/i.test(t) &&
          !/^\d+%?\s*off$/i.test(t) &&
          !t.startsWith('Bank Offer') &&
          !t.startsWith('Hot Deal') &&
          !t.startsWith('Only ') &&
          t !== '✕'
        );

        // Title: the first meaningful long text (product description) in cleanTexts
        const title = cleanTexts.find(t => t.length > 20 && !t.startsWith('₹')) || cleanTexts.find(t => t.length > 5 && !t.startsWith('₹')) || '';

        // Brand: extract from the beginning of the title (e.g. "ASUS ROG Strix..." -> "ASUS")
        const brandMatch = title.match(/^([A-Z][A-Za-z0-9]+)/);
        const brand = brandMatch ? brandMatch[1] : '';

        // Prices: texts starting with ₹
        const parseCount = (value) => {
          const text = String(value || '').replace(/,/g, '').trim();
          const match = text.match(/(\d+(?:\.\d+)?)\s*([kmb])?/i);
          if (!match) return 0;
          const multiplier = { k: 1000, m: 1000000, b: 1000000000 }[match[2]?.toLowerCase()] || 1;
          return Math.round(parseFloat(match[1]) * multiplier);
        };
        const parsePrice = (value) => {
          const match = String(value || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
          return match ? Math.round(parseFloat(match[0])) : 0;
        };
        const prices = leafTexts.filter(t => t.startsWith('₹')).map(parsePrice).filter(n => n > 0);
        const price = prices[0] || 0;
        const originalPrice = prices.find(p => p > price) || null;

        // Rating: text matching pattern like "4.2"
        const ratingText = leafTexts.find(t => /^\d(?:\.\d)?$/.test(t) && parseFloat(t) <= 5);
        const rating = ratingText ? parseFloat(ratingText) : null;

        // Review/rating count from texts like "31 Ratings" or "185 Ratings"
        const ratingCountText = leafTexts.find(t => /^[\d,.]+[KMB]?\s*Ratings?$/i.test(t));
        const reviewCount = parseCount(ratingCountText);

        // Extract PID from href
        const pidMatch = href.match(/pid=([^&]+)/);
        const pid = pidMatch ? pidMatch[1] : dataId;

        if (!title || price === 0) return null;

        return {
          platformId: pid,
          platform: 'flipkart',
          title,
          price,
          originalPrice,
          currency: 'INR',
          rating,
          reviewCount,
          images: img ? [img.src] : [],
          url: `https://www.flipkart.com${href}`,
          brand,
          availability: true,
          sponsored,
        };
      }).filter(Boolean);
    }, config.scraping.maxResultsPerPlatform);

    logger.info(`Flipkart: found ${products.length} products for "${query}"`);
    return products;
  } catch (err) {
    logger.error(`Flipkart search error: ${err.message}`);
    return [];
  } finally {
    await safeClose(page);
  }
};

const getProductDetail = async (productId) => {
  const page = await createPage();
  try {
    await page.goto(`${FLIPKART_BASE}/product/p?pid=${productId}`, { waitUntil: 'domcontentloaded' });
    await waitForAnySelector(page, ['.B_NuCI', '._35KyD6', 'h1'], 12000);

    // Close login popup
    try {
      const closeBtn = await page.$('button._2KpZ6l._2doB4z');
      if (closeBtn) await closeBtn.click();
    } catch {}

    const product = await page.evaluate((pid) => {
      const title = document.querySelector('.B_NuCI, ._35KyD6')?.textContent?.trim() || '';
      const priceEl = document.querySelector('._30jeq3._16Jk6d');
      const price = parseFloat(priceEl?.textContent?.replace(/[^\d.]/g, '') || '0');
      const ratingEl = document.querySelector('._3LWZlK._1BLPMq');
      const rating = parseFloat(ratingEl?.textContent?.trim() || '0');
      const reviewCountEl = document.querySelector('._2_R_DZ span');
      const reviewText = reviewCountEl?.textContent || '';
      const reviewMatch = reviewText.match(/([\d,]+)\s*(?:Ratings|Reviews)/i);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ''), 10) : 0;

      const images = Array.from(document.querySelectorAll('._2amPTt._3qGmMb img, ._396cs4'))
        .map(img => img.src?.replace(/128\/128/, '416/416') || '')
        .filter(Boolean);

      const brand = document.querySelector('._2J4LW2')?.textContent?.trim() || '';

      const reviews = Array.from(document.querySelectorAll('._27M-vq')).slice(0, 20).map(rev => ({
        author: rev.querySelector('._2sc7ZR._2V5EHH')?.textContent?.trim() || 'Anonymous',
        rating: parseFloat(rev.querySelector('._3LWZlK')?.textContent?.trim() || '0'),
        title: rev.querySelector('p._2-N8zT')?.textContent?.trim() || '',
        text: rev.querySelector('.t-ZTKy div div')?.textContent?.trim() || '',
        verified: !!rev.querySelector('._2mcZGo'),
      }));

      return { platformId: pid, title, price, currency: 'INR', rating, reviewCount, images, brand, url: window.location.href, availability: true, reviews };
    }, productId);

    product.platform = 'flipkart';
    return product;
  } catch (err) {
    logger.error(`Flipkart product detail error: ${err.message}`);
    throw err;
  } finally {
    await safeClose(page);
  }
};

module.exports = { search, getProductDetail };
