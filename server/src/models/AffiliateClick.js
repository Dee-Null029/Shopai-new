const mongoose = require('mongoose');

const affiliateClickSchema = new mongoose.Schema({
  linkId: { type: String, required: true, index: true },
  platform: { type: String, required: true, enum: ['amazon', 'flipkart', 'myntra'] },
  productId: String,
  productTitle: String,
  affiliateUrl: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: String,
  userAgent: String,
  referrer: String,
  clickedAt: { type: Date, default: Date.now },
}, { timestamps: true });

affiliateClickSchema.index({ clickedAt: -1 });
affiliateClickSchema.index({ platform: 1, clickedAt: -1 });

module.exports = mongoose.model('AffiliateClick', affiliateClickSchema);
