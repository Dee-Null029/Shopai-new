const { parseCount, parsePrice, parseRating } = require('./scrapers/scraperUtils');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'by', 'for', 'from', 'in', 'is', 'new', 'of', 'on',
  'or', 'the', 'to', 'with', 'women', 'mens', 'men', 'boys', 'girls',
]);

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^\w\s.-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const compactTitle = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const stemToken = (token) => {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
};

const tokenize = (value) => normalizeText(value)
  .split(/\s+/)
  .map(stemToken)
  .filter(token => token.length > 1 && !STOP_WORDS.has(token));

const inferBrand = (raw) => {
  if (raw.brand) return compactTitle(raw.brand);
  const title = compactTitle(raw.title);
  const match = title.match(/^([A-Za-z][A-Za-z0-9&.-]{1,24})\b/);
  return match ? match[1] : '';
};

const normalizeProduct = (raw) => {
  const price = parsePrice(raw.price);
  const originalPrice = parsePrice(raw.originalPrice);
  const title = compactTitle(raw.title);

  return {
    platformId: String(raw.platformId || raw.id || '').trim(),
    platform: String(raw.platform || 'unknown').toLowerCase(),
    title,
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    currency: raw.currency || 'INR',
    rating: parseRating(raw.rating),
    reviewCount: parseCount(raw.reviewCount),
    images: Array.isArray(raw.images) ? [...new Set(raw.images.filter(Boolean))] : [],
    url: raw.url || '',
    category: raw.category || '',
    brand: inferBrand(raw),
    seller: raw.seller || null,
    availability: raw.availability !== false,
    sponsored: raw.sponsored === true,
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
  };
};

const normalizeProducts = (products) => products
  .map(normalizeProduct)
  .filter(product => product.title && product.price > 0 && product.url);

const computeRelevance = (product, query) => {
  if (!query) return 1;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 1;

  const targetTokens = new Set(tokenize(`${product.title} ${product.brand} ${product.category}`));
  const targetText = normalizeText(`${product.title} ${product.brand} ${product.category}`);
  const queryText = normalizeText(query);

  let tokenScore = 0;
  for (const token of queryTokens) {
    if (targetTokens.has(token)) tokenScore += 1;
    else if (token.length >= 4 && targetText.includes(token)) tokenScore += 0.55;
  }

  const overlapScore = tokenScore / queryTokens.length;
  const phraseBoost = targetText.includes(queryText) ? 0.25 : 0;
  const brandBoost = product.brand && normalizeText(product.brand) === queryTokens[0] ? 0.1 : 0;

  return Math.min(1, overlapScore + phraseBoost + brandBoost);
};

const filterByRelevance = (products, query) => {
  if (!query) return products;

  const queryTokens = tokenize(query);
  const threshold = queryTokens.length <= 1 ? 0.55 : queryTokens.length <= 3 ? 0.45 : 0.4;
  const scored = products.map(product => ({ ...product, relevanceScore: computeRelevance(product, query) }));

  return scored
    .filter(product => product.relevanceScore >= threshold)
    .sort((a, b) =>
      b.relevanceScore - a.relevanceScore ||
      Number(a.sponsored) - Number(b.sponsored) ||
      (b.reviewCount || 0) - (a.reviewCount || 0) ||
      (b.rating || 0) - (a.rating || 0)
    );
};

const similarity = (a, b) => {
  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
};

const productQualityScore = (product) => {
  let score = 0;
  if (product.images?.length) score += 10;
  if (product.rating) score += product.rating * 10;
  score += Math.min(product.reviewCount || 0, 1000) / 20;
  if (product.availability) score += 10;
  if (!product.sponsored) score += 5;
  return score;
};

const appendVariant = (target, variant) => {
  const existingVariants = target.variants || [];
  const variantKey = `${variant.platform}:${variant.platformId}:${variant.price}`;
  if (existingVariants.some(item => `${item.platform}:${item.platformId}:${item.price}` === variantKey)) return;

  target.variants = [
    ...existingVariants,
    {
      platform: variant.platform,
      platformId: variant.platformId,
      price: variant.price,
      originalPrice: variant.originalPrice,
      rating: variant.rating,
      reviewCount: variant.reviewCount,
      url: variant.url,
    },
  ];
};

const mergeDuplicate = (existing, candidate) => {
  const keepCandidate = productQualityScore(candidate) > productQualityScore(existing);
  const primary = keepCandidate ? candidate : existing;
  const secondary = keepCandidate ? existing : candidate;

  appendVariant(primary, secondary);
  for (const variant of secondary.variants || []) appendVariant(primary, variant);

  return {
    ...primary,
    images: [...new Set([...(primary.images || []), ...(secondary.images || [])])],
    reviews: primary.reviews?.length ? primary.reviews : secondary.reviews,
  };
};

const deduplicateProducts = (products) => {
  const unique = [];
  const byPlatformId = new Set();

  for (const product of products) {
    const platformKey = `${product.platform}:${product.platformId || product.url}`;
    if (byPlatformId.has(platformKey)) continue;
    byPlatformId.add(platformKey);

    const duplicateIndex = unique.findIndex(existing => {
      if (existing.platform === product.platform) return false;

      const titleSim = similarity(existing.title, product.title);
      const priceDiff = Math.abs(existing.price - product.price) / Math.max(existing.price, product.price, 1);
      const brandMatch = existing.brand && product.brand && normalizeText(existing.brand) === normalizeText(product.brand);

      return priceDiff < 0.35 && (titleSim >= 0.62 || (brandMatch && titleSim >= 0.5));
    });

    if (duplicateIndex === -1) {
      unique.push(product);
    } else {
      unique[duplicateIndex] = mergeDuplicate(unique[duplicateIndex], product);
    }
  }

  return unique;
};

module.exports = {
  computeRelevance,
  deduplicateProducts,
  filterByRelevance,
  normalizeProduct,
  normalizeProducts,
  similarity,
};
