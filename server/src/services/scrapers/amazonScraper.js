const { createPage, safeClose } = require('./baseScraper');
const logger = require('../../middleware/logger');
const config = require('../../config/env');
const { waitForAnySelector } = require('./scraperUtils');

const AMAZON_BASE = 'https://www.amazon.in';

const search = async (query, options = {}) => {
  const page = await createPage();
  try {
    const url = `${AMAZON_BASE}/s?k=${encodeURIComponent(query)}${options.category ? `&i=${options.category}` : ''}&page=${options.page || 1}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitForAnySelector(page, ['[data-component-type="s-search-result"]', '.s-no-outline'], 12000);

    const products = await page.evaluate((limit) => {
      const items = document.querySelectorAll('[data-component-type="s-search-result"]');
      return Array.from(items).slice(0, limit).map(item => {
        const asin = item.getAttribute('data-asin');
        if (!asin) return null;

        const titleEl = item.querySelector('h2 a span') || item.querySelector('h2 span') || item.querySelector('[data-cy="title-recipe"] span');
        const priceEl = item.querySelector('.a-price .a-offscreen');
        const originalPriceEl = item.querySelector('.a-price.a-text-price .a-offscreen');
        const ratingEl = item.querySelector('.a-icon-alt');
        const imageEl = item.querySelector('.s-image');
        const sponsored = /sponsored/i.test(item.textContent || '');
        const availabilityText = item.textContent || '';

        const reviewLink = Array.from(item.querySelectorAll('a, span')).find(el => /^\(?[\d,.]+[KMB]?\)?$/i.test(el.textContent.trim()));

        const parseCount = (value) => {
          const text = String(value || '').replace(/[()]/g, '').replace(/,/g, '').trim();
          const match = text.match(/(\d+(?:\.\d+)?)\s*([kmb])?/i);
          if (!match) return 0;
          const multiplier = { k: 1000, m: 1000000, b: 1000000000 }[match[2]?.toLowerCase()] || 1;
          return Math.round(parseFloat(match[1]) * multiplier);
        };
        const parsePrice = (value) => {
          const match = String(value || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
          return match ? Math.round(parseFloat(match[0])) : 0;
        };
        const parseRating = (value) => {
          const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
          return match ? Math.min(parseFloat(match[1]), 5) : null;
        };

        const title = titleEl?.textContent?.trim() || '';
        if (!title) return null;
        const price = parsePrice(priceEl?.textContent);
        if (!price) return null;

        return {
          platformId: asin,
          platform: 'amazon',
          title,
          price,
          originalPrice: parsePrice(originalPriceEl?.textContent) || null,
          currency: 'INR',
          rating: parseRating(ratingEl?.textContent),
          reviewCount: parseCount(reviewLink?.textContent),
          images: imageEl ? [imageEl.src] : [],
          url: `https://www.amazon.in/dp/${asin}`,
          availability: !/currently unavailable|out of stock/i.test(availabilityText),
          sponsored,
        };
      }).filter(Boolean);
    }, config.scraping.maxResultsPerPlatform);

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
    await waitForAnySelector(page, ['#productTitle', '#centerCol'], 12000);

    const product = await page.evaluate((asinId) => {
      const title = document.querySelector('#productTitle')?.textContent?.trim() || '';
      const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen');
      const parseCount = (value) => parseInt(String(value || '').replace(/[^\d]/g, '') || '0', 10);
      const parsePrice = (value) => {
        const match = String(value || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
        return match ? Math.round(parseFloat(match[0])) : 0;
      };
      const parseRating = (value) => {
        const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
        return match ? Math.min(parseFloat(match[1]), 5) : null;
      };
      const price = parsePrice(priceEl?.textContent);
      const ratingEl = document.querySelector('#acrPopover .a-icon-alt');
      const rating = parseRating(ratingEl?.textContent);
      const reviewCountEl = document.querySelector('#acrCustomerReviewText');
      const reviewCount = parseCount(reviewCountEl?.textContent);
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
