const { createPage, safeClose } = require('./baseScraper');
const logger = require('../../middleware/logger');

const AMAZON_BASE = 'https://www.amazon.in';

const search = async (query, options = {}) => {
  const page = await createPage();
  try {
    const url = `${AMAZON_BASE}/s?k=${encodeURIComponent(query)}${options.category ? `&i=${options.category}` : ''}&page=${options.page || 1}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await new Promise(r => setTimeout(r, 2000));

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-component-type="s-search-result"]');
      return Array.from(items).slice(0, 20).map(item => {
        const asin = item.getAttribute('data-asin');
        if (!asin) return null;

        // Title: .a-text-normal is the current selector for product title
        const titleEl = item.querySelector('.a-text-normal') || item.querySelector('h2 span');
        const priceEl = item.querySelector('.a-price .a-offscreen');
        const originalPriceEl = item.querySelector('.a-price.a-text-price .a-offscreen');
        const ratingEl = item.querySelector('.a-icon-alt');
        const imageEl = item.querySelector('.s-image');

        // Review count: look for text like "(38K)" or "(1,234)"
        const reviewLink = Array.from(item.querySelectorAll('a')).find(a => /^\([\d,.]+[KMB]?\)$/i.test(a.textContent.trim()));
        let reviewCount = 0;
        if (reviewLink) {
          const rt = reviewLink.textContent.replace(/[()]/g, '').trim();
          if (rt.endsWith('K') || rt.endsWith('k')) reviewCount = Math.round(parseFloat(rt) * 1000);
          else if (rt.endsWith('M') || rt.endsWith('m')) reviewCount = Math.round(parseFloat(rt) * 1000000);
          else reviewCount = parseInt(rt.replace(/,/g, ''), 10) || 0;
        }

        const priceText = priceEl?.textContent?.replace(/[^\d]/g, '') || '0';
        const originalPriceText = originalPriceEl?.textContent?.replace(/[^\d]/g, '') || '';
        const ratingText = ratingEl?.textContent?.match(/([\d.]+)/)?.[1] || '';

        const title = titleEl?.textContent?.trim() || '';
        if (!title) return null;

        return {
          platformId: asin,
          platform: 'amazon',
          title,
          price: parseFloat(priceText) || 0,
          originalPrice: originalPriceText ? parseFloat(originalPriceText) : null,
          currency: 'INR',
          rating: ratingText ? parseFloat(ratingText) : null,
          reviewCount,
          images: imageEl ? [imageEl.src] : [],
          url: `https://www.amazon.in/dp/${asin}`,
          availability: true,
        };
      }).filter(Boolean);
    });

    logger.info(`Amazon: found ${products.length} products for "${query}"`);
    return products;
  } catch (err) {
    logger.error(`Amazon search error: ${err.message}`);
    return [];
  } finally {
    await safeClose(page);
  }
};

const getProductDetail = async (asin) => {
  const page = await createPage();
  try {
    await page.goto(`${AMAZON_BASE}/dp/${asin}`, { waitUntil: 'domcontentloaded' });

    const product = await page.evaluate((asinId) => {
      const title = document.querySelector('#productTitle')?.textContent?.trim() || '';
      const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen');
      const price = parseFloat(priceEl?.textContent?.replace(/[^\d.]/g, '') || '0');
      const ratingEl = document.querySelector('#acrPopover .a-icon-alt');
      const rating = parseFloat(ratingEl?.textContent?.match(/([\d.]+)/)?.[1] || '0');
      const reviewCountEl = document.querySelector('#acrCustomerReviewText');
      const reviewCount = parseInt(reviewCountEl?.textContent?.replace(/[^\d]/g, '') || '0', 10);
      const images = Array.from(document.querySelectorAll('#altImages img'))
        .map(img => img.src?.replace(/_S[CX]\d+_/, '_SL500_') || '')
        .filter(src => src && !src.includes('play-button'));
      const brand = document.querySelector('#bylineInfo')?.textContent?.replace('Visit the ', '').replace(' Store', '').trim() || '';

      // Get reviews
      const reviews = Array.from(document.querySelectorAll('[data-hook="review"]')).slice(0, 20).map(rev => ({
        author: rev.querySelector('.a-profile-name')?.textContent?.trim() || 'Anonymous',
        rating: parseFloat(rev.querySelector('[data-hook="review-star-rating"] .a-icon-alt')?.textContent?.match(/([\d.]+)/)?.[1] || '0'),
        title: rev.querySelector('[data-hook="review-title"] span')?.textContent?.trim() || '',
        text: rev.querySelector('[data-hook="review-body"] span')?.textContent?.trim() || '',
        verified: !!rev.querySelector('[data-hook="avp-badge"]'),
      }));

      return {
        platformId: asinId,
        title, price, currency: 'INR', rating, reviewCount, images, brand,
        url: window.location.href,
        availability: !document.querySelector('#outOfStock'),
        reviews,
      };
    }, asin);

    product.platform = 'amazon';
    return product;
  } catch (err) {
    logger.error(`Amazon product detail error: ${err.message}`);
    throw err;
  } finally {
    await safeClose(page);
  }
};

module.exports = { search, getProductDetail };
