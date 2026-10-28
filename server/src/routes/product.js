const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { cache } = require('../config/redis');
const { scrapeProductDetail } = require('../services/scrapers/baseScraper');
const Product = require('../models/Product');
const logger = require('../middleware/logger');

const router = express.Router();

const hasUsableDetails = (product) => (
  product &&
  typeof product.title === 'string' &&
  product.title.trim().length > 3 &&
  !/^\d+$/.test(product.title.trim()) &&
  Number(product.price) > 0 &&
  typeof product.url === 'string' &&
  product.url.length > 0
);

const productSchema = z.object({
  params: z.object({
    platform: z.enum(['amazon', 'flipkart', 'myntra']),
    id: z.string().min(1),
  }),
});

router.get('/:platform/:id', validate(productSchema), async (req, res, next) => {
  try {
    const { platform, id } = req.params;
    const cacheKey = `product:${platform}:${id}`;

    const cached = await cache.get(cacheKey);
    if (hasUsableDetails(cached)) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Check DB first
    let product = await Product.findOne({ platform, platformId: id });

    if (!product || (Date.now() - product.updatedAt > 3600000)) {
      // Scrape fresh data
      const scraped = await scrapeProductDetail(platform, id);
      
      if (hasUsableDetails(scraped)) {
        if (product) {
          Object.assign(product, scraped);
          await product.save();
        } else {
          try {
            product = await Product.create({ ...scraped, platform, platformId: id });
          } catch {
            // If DB save fails, just use the scraped data directly
            product = { ...scraped, platform, platformId: id };
          }
        }
      } else if (!product || !hasUsableDetails(product)) {
        return res.status(502).json({
          success: false,
          message: 'Product details are temporarily unavailable from the source platform',
        });
      }
    }

    await cache.set(cacheKey, product, 3600);
    res.json({ success: true, data: product, cached: false });
  } catch (err) { next(err); }
});

module.exports = router;
