const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { searchLimiter } = require('../middleware/rateLimiter');
const { cache } = require('../config/redis');
const { searchAllPlatforms } = require('../services/scrapers/baseScraper');
const { normalizeProducts, deduplicateProducts, filterByRelevance } = require('../services/productNormalizer');
const { analyzeSentiment } = require('../services/sentimentAnalyzer');
const { rankProducts } = require('../services/rankingEngine');
const logger = require('../middleware/logger');

const router = express.Router();

const rankingSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
    category: z.string().optional(),
    wPrice: z.coerce.number().min(0).max(1).default(0.25),
    wRating: z.coerce.number().min(0).max(1).default(0.25),
    wSentiment: z.coerce.number().min(0).max(1).default(0.25),
    wReliability: z.coerce.number().min(0).max(1).default(0.25),
  }),
});

router.get('/', searchLimiter, validate(rankingSchema), async (req, res, next) => {
  try {
    const { q, category, wPrice, wRating, wSentiment, wReliability } = req.query;
    const weights = { price: wPrice, rating: wRating, sentiment: wSentiment, reliability: wReliability };
    const cacheKey = `ranking:${q}:${category || ''}:${JSON.stringify(weights)}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Search across platforms
    const rawResults = await searchAllPlatforms(q, { category, page: 1 });
    const normalized = normalizeProducts(rawResults);
    const deduplicated = deduplicateProducts(normalized);
    const relevant = filterByRelevance(deduplicated, q);

    // Run sentiment analysis with concurrency limit (max 5 at a time)
    const CONCURRENCY = 5;
    const productsWithSentiment = [];
    for (let i = 0; i < relevant.length; i += CONCURRENCY) {
      const batch = relevant.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (product) => {
          try {
            if (product.reviews?.length > 0) {
              const sentiment = await analyzeSentiment(product.reviews, product.title);
              return { ...product, sentiment };
            }
            const fallbackScore = product.rating ? Math.round((product.rating / 5) * 100) : 50;
            return { ...product, sentiment: { score: fallbackScore } };
          } catch {
            return { ...product, sentiment: { score: 50 } };
          }
        })
      );
      productsWithSentiment.push(...results);
    }

    // Rank products
    const ranked = rankProducts(productsWithSentiment, weights);

    const responseData = { query: q, weights, total: ranked.length, products: ranked };
    await cache.set(cacheKey, responseData, 900);

    res.json({ success: true, data: responseData, cached: false });
  } catch (err) { next(err); }
});

module.exports = router;
