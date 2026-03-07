const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { cache } = require('../config/redis');
const { analyzeSentiment } = require('../services/sentimentAnalyzer');
const Product = require('../models/Product');
const { scrapeProductDetail } = require('../services/scrapers/baseScraper');
const logger = require('../middleware/logger');

const router = express.Router();

const sentimentSchema = z.object({
  params: z.object({
    platform: z.enum(['amazon', 'flipkart', 'myntra']),
    productId: z.string().min(1),
  }),
});

router.get('/:platform/:productId', validate(sentimentSchema), async (req, res, next) => {
  try {
    const { platform, productId } = req.params;
    const cacheKey = `sentiment:${platform}:${productId}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Get product with reviews
    let product = await Product.findOne({ platform, platformId: productId });

    if (!product) {
      const scraped = await scrapeProductDetail(platform, productId);
      if (!scraped.title) {
        return res.json({ success: true, data: { overallSentiment: 'neutral', score: 50, pros: [], cons: [], summary: 'Could not scrape product details.', reviewCount: 0, analyzedAt: new Date() } });
      }
      try {
        product = await Product.create({ ...scraped, platform, platformId: productId });
      } catch (dbErr) {
        logger.warn('Failed to save product, using scraped data', { error: dbErr.message });
        product = scraped;
      }
    }

    // Check if sentiment is recent (within 24h)
    if (product.sentiment?.analyzedAt && (Date.now() - product.sentiment.analyzedAt < 86400000)) {
      await cache.set(cacheKey, product.sentiment, 86400);
      return res.json({ success: true, data: product.sentiment, cached: false });
    }

    // Run sentiment analysis
    const reviews = product.reviews || [];
    if (reviews.length === 0) {
      const noReviewSentiment = {
        overallSentiment: 'neutral',
        score: 50,
        pros: [],
        cons: [],
        summary: 'No reviews available for analysis.',
        reviewCount: 0,
        analyzedAt: new Date(),
      };
      return res.json({ success: true, data: noReviewSentiment });
    }

    const sentiment = await analyzeSentiment(reviews, product.title);
    sentiment.analyzedAt = new Date();
    sentiment.reviewCount = reviews.length;

    // Save to product
    product.sentiment = sentiment;
    await product.save();

    await cache.set(cacheKey, sentiment, 86400);
    res.json({ success: true, data: sentiment, cached: false });
  } catch (err) { next(err); }
});

module.exports = router;
