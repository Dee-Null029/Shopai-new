const PLATFORM_TRUST = {
  amazon: 85,
  flipkart: 80,
  myntra: 78,
};

const computePriceScore = (price, allPrices) => {
  if (allPrices.length <= 1) return 50;
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  if (max === min) return 50;
  // Lower price = higher score
  return Math.round(((max - price) / (max - min)) * 100);
};

const computeRatingScore = (rating, reviewCount) => {
  if (!rating) return 50;
  // Bayesian average: pulls ratings toward 3.0 for low review counts
  const globalMean = 3.5;
  const minReviews = 10;
  const bayesianRating = ((minReviews * globalMean) + (reviewCount * rating)) / (minReviews + reviewCount);
  return Math.round((bayesianRating / 5) * 100);
};

const computeSentimentScore = (sentiment) => {
  if (!sentiment || typeof sentiment.score !== 'number') return 50;
  return Math.max(0, Math.min(100, sentiment.score));
};

const computeReliabilityScore = (product) => {
  let score = PLATFORM_TRUST[product.platform] || 70;

  // Boost for seller rating
  if (product.seller?.rating) {
    score = score * 0.7 + (product.seller.rating / 5) * 100 * 0.3;
  }

  // Penalty for low review count (less reliable signals)
  if (product.reviewCount < 10) score -= 10;
  else if (product.reviewCount > 100) score += 5;

  // Penalty for unavailable
  if (!product.availability) score -= 20;

  // Bonus for discount (seller confidence)
  if (product.originalPrice && product.price < product.originalPrice) {
    const discount = (product.originalPrice - product.price) / product.originalPrice;
    if (discount > 0.1 && discount < 0.7) score += 5; // reasonable discount
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const rankProducts = (products, weights = {}) => {
  const w = {
    price: weights.price ?? 0.25,
    rating: weights.rating ?? 0.25,
    sentiment: weights.sentiment ?? 0.25,
    reliability: weights.reliability ?? 0.25,
  };

  // Normalize weights to sum to 1
  const totalW = w.price + w.rating + w.sentiment + w.reliability;
  if (totalW > 0) {
    w.price /= totalW;
    w.rating /= totalW;
    w.sentiment /= totalW;
    w.reliability /= totalW;
  }

  const allPrices = products.map(p => p.price).filter(p => p > 0);

  const scored = products.map(product => {
    const scores = {
      price: computePriceScore(product.price, allPrices),
      rating: computeRatingScore(product.rating, product.reviewCount),
      sentiment: computeSentimentScore(product.sentiment),
      reliability: computeReliabilityScore(product),
    };

    const composite = Math.round(
      w.price * scores.price +
      w.rating * scores.rating +
      w.sentiment * scores.sentiment +
      w.reliability * scores.reliability
    );

    return {
      ...product,
      scores,
      compositeScore: composite,
    };
  });

  // Sort by composite score descending
  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  return scored;
};

module.exports = { rankProducts, computePriceScore, computeRatingScore, computeSentimentScore, computeReliabilityScore };
