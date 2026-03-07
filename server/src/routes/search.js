const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { searchLimiter } = require('../middleware/rateLimiter');
const { cache } = require('../config/redis');
const { searchAllPlatforms } = require('../services/scrapers/baseScraper');
const { normalizeProducts, deduplicateProducts, filterByRelevance } = require('../services/productNormalizer');
const logger = require('../middleware/logger');

const router = express.Router();

const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
    category: z.string().optional(),
    page: z.coerce.number().int().min(1).max(10).default(1),
    platforms: z.string().optional(),
    sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'reviews']).default('relevance'),
  }),
});

router.get('/', searchLimiter, validate(searchSchema), async (req, res, next) => {
  try {
    const { q, category, page, platforms, sortBy } = req.query;
    const cacheKey = `search:${q}:${category || ''}:${page}:${platforms || 'all'}:${sortBy}`;

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for search: ${q}`);
      return res.json({ success: true, data: cached, cached: true });
    }

    const platformList = platforms ? platforms.split(',') : ['amazon', 'flipkart', 'myntra'];
    const rawResults = await searchAllPlatforms(q, { category, page, platforms: platformList });
    const normalized = normalizeProducts(rawResults);
    const deduplicated = deduplicateProducts(normalized);
    const relevant = filterByRelevance(deduplicated, q);

    // Sort
    let sorted = [...relevant];
    switch (sortBy) {
      case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'rating': sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'reviews': sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); break;
      default: break;
    }

    const responseData = {
      query: q,
      total: sorted.length,
      page,
      products: sorted,
      platforms: platformList,
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, responseData, 900);

    res.json({ success: true, data: responseData, cached: false });
  } catch (err) { next(err); }
});

module.exports = router;
