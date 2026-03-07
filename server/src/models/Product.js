const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  platformId: { type: String, required: true },
  platform: { type: String, required: true, enum: ['amazon', 'flipkart', 'myntra'] },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  currency: { type: String, default: 'INR' },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  images: [String],
  url: { type: String, required: true },
  category: String,
  brand: String,
  seller: { name: String, rating: Number },
  availability: { type: Boolean, default: true },
  specifications: mongoose.Schema.Types.Mixed,
  sentiment: {
    overallSentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    score: { type: Number, min: 0, max: 100 },
    pros: [String],
    cons: [String],
    summary: String,
    analyzedAt: Date,
  },
  reviews: [{
    author: String,
    rating: Number,
    title: String,
    text: String,
    date: Date,
    verified: Boolean,
  }],
  affiliateUrl: String,
}, { timestamps: true });

productSchema.index({ platform: 1, platformId: 1 }, { unique: true });
productSchema.index({ title: 'text', brand: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
