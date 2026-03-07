const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const AffiliateClick = require('../models/AffiliateClick');
const { auth, optionalAuth } = require('../middleware/auth');
const { generateAffiliateUrl } = require('../services/affiliateService');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

const generateSchema = z.object({
  body: z.object({
    platform: z.enum(['amazon', 'flipkart', 'myntra']),
    productUrl: z.string().url(),
    productId: z.string().optional(),
    productTitle: z.string().max(500).optional(),
  }),
});

// Generate affiliate link for a product
router.post('/generate', validate(generateSchema), async (req, res, next) => {
  try {
    const { platform, productUrl, productId, productTitle } = req.body;

    const linkId = uuidv4();
    const affiliateUrl = generateAffiliateUrl(platform, productUrl);

    res.json({
      success: true,
      data: {
        linkId,
        redirectUrl: `/api/affiliate/redirect/${linkId}`,
        platform,
        productId,
        productTitle,
        affiliateUrl,
      },
    });
  } catch (err) { next(err); }
});

// Redirect through affiliate link and track click
router.get('/redirect/:linkId', optionalAuth, async (req, res, next) => {
  try {
    const { linkId } = req.params;
    const { url, platform, productId, title } = req.query;

    if (!url || !platform) {
      return next(new AppError('Missing redirect parameters', 400));
    }

    const affiliateUrl = generateAffiliateUrl(platform, url);
    if (!affiliateUrl) {
      return next(new AppError('Invalid or disallowed redirect URL', 400));
    }

    // Log click asynchronously
    AffiliateClick.create({
      linkId,
      platform,
      productId,
      productTitle: title,
      affiliateUrl,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
    }).catch(() => {}); // fire and forget

    res.redirect(affiliateUrl);
  } catch (err) { next(err); }
});

// Admin: Get affiliate analytics
router.get('/analytics', auth, async (req, res, next) => {
  try {
    // Only allow admin users
    if (req.user.role !== 'admin') {
      return next(new AppError('Admin access required', 403));
    }
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const since = new Date(Date.now() - days * 86400000);

    const [totalClicks, byPlatform, recentClicks] = await Promise.all([
      AffiliateClick.countDocuments({ clickedAt: { $gte: since } }),
      AffiliateClick.aggregate([
        { $match: { clickedAt: { $gte: since } } },
        { $group: { _id: '$platform', clicks: { $sum: 1 } } },
      ]),
      AffiliateClick.find({ clickedAt: { $gte: since } })
        .sort({ clickedAt: -1 })
        .limit(50)
        .select('platform productTitle clickedAt'),
    ]);

    // Daily breakdown
    const dailyClicks = await AffiliateClick.aggregate([
      { $match: { clickedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalClicks,
        byPlatform: byPlatform.reduce((acc, p) => { acc[p._id] = p.clicks; return acc; }, {}),
        dailyClicks,
        recentClicks,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
