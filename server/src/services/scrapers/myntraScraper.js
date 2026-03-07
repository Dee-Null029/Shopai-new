const { createPage, safeClose } = require('./baseScraper');
const logger = require('../../middleware/logger');

const MYNTRA_BASE = 'https://www.myntra.com';

const search = async (query, options = {}) => {
  const page = await createPage();
  try {
    const url = `${MYNTRA_BASE}/${encodeURIComponent(query.replace(/\s+/g, '-'))}?p=${options.page || 1}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await new Promise(r => setTimeout(r, 2000));

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.product-base');
      return Array.from(items).slice(0, 20).map(item => {
        const linkEl = item.querySelector('a');
        const href = linkEl?.getAttribute('href') || '';
        const brandEl = item.querySelector('.product-brand');
        const titleEl = item.querySelector('.product-product');
        // Try multiple price selectors
        const priceEl = item.querySelector('.product-discountedPrice') || item.querySelector('.product-price span');
        const originalPriceEl = item.querySelector('.product-strike');
        const ratingEl = item.querySelector('.product-ratingsContainer span');
        const reviewCountEl = item.querySelector('.product-ratingsCount');
        const imageEl = item.querySelector('.product-imageSliderContainer img');

        // Parse prices: strip "Rs. " prefix and commas, then parse
        const parsePrice = (text) => {
          if (!text) return 0;
          return parseInt(text.replace(/Rs\.?\s*/i, '').replace(/[^\d]/g, ''), 10) || 0;
        };

        const price = parsePrice(priceEl?.textContent);
        const originalPrice = parsePrice(originalPriceEl?.textContent) || null;
        const ratingText = ratingEl?.textContent?.trim() || '';
        const reviewText = reviewCountEl?.textContent?.replace(/[^\d]/g, '') || '0';

        // Extract product ID from URL
        const idMatch = href.match(/\/(\d+)\/buy$/);
        const productId = idMatch ? idMatch[1] : '';

        return {
          platformId: productId,
          platform: 'myntra',
          title: `${brandEl?.textContent?.trim() || ''} ${titleEl?.textContent?.trim() || ''}`.trim(),
          price,
          originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
          currency: 'INR',
          rating: ratingText ? parseFloat(ratingText) : null,
          reviewCount: parseInt(reviewText, 10) || 0,
          images: imageEl ? [imageEl.src] : [],
          url: href ? `https://www.myntra.com/${href}` : '',
          brand: brandEl?.textContent?.trim() || '',
          availability: true,
        };
      }).filter(p => p.title && p.price > 0);
    });

    logger.info(`Myntra: found ${products.length} products for "${query}"`);
    return products;
  } catch (err) {
    logger.error(`Myntra search error: ${err.message}`);
    return [];
  } finally {
    await safeClose(page);
  }
};

const getProductDetail = async (productId) => {
  const page = await createPage();
  try {
    await page.goto(`${MYNTRA_BASE}/product/${productId}`, { waitUntil: 'domcontentloaded' });

    const product = await page.evaluate((pid) => {
      const brand = document.querySelector('.pdp-title')?.textContent?.trim() || '';
      const titleEl = document.querySelector('.pdp-name');
      const title = `${brand} ${titleEl?.textContent?.trim() || ''}`.trim();
      const priceEl = document.querySelector('.pdp-price strong');
      const price = parseFloat(priceEl?.textContent?.replace(/[^\d.]/g, '') || '0');
      const ratingEl = document.querySelector('.index-overallRating div:first-child');
      const rating = parseFloat(ratingEl?.textContent?.trim() || '0');
      const reviewCountEl = document.querySelector('.index-ratingsCount');
      const reviewCount = parseInt(reviewCountEl?.textContent?.replace(/[^\d]/g, '') || '0', 10);

      const images = Array.from(document.querySelectorAll('.image-grid-image'))
        .map(div => {
          const style = div.getAttribute('style') || '';
          const urlMatch = style.match(/url\(["']?([^"')]+)/);
          return urlMatch ? urlMatch[1] : '';
        })
        .filter(Boolean);

      const reviews = Array.from(document.querySelectorAll('.user-review')).slice(0, 20).map(rev => ({
        author: rev.querySelector('.user-review-userName')?.textContent?.trim() || 'Anonymous',
        rating: parseFloat(rev.querySelector('.user-review-starRating')?.textContent?.trim() || '0'),
        title: '',
        text: rev.querySelector('.user-review-body')?.textContent?.trim() || '',
        verified: true,
      }));

      return { platformId: pid, title, price, currency: 'INR', rating, reviewCount, images, brand, url: window.location.href, availability: true, reviews };
    }, productId);

    product.platform = 'myntra';
    return product;
  } catch (err) {
    logger.error(`Myntra product detail error: ${err.message}`);
    throw err;
  } finally {
    await safeClose(page);
  }
};

module.exports = { search, getProductDetail };
