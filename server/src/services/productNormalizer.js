const normalizeProduct = (raw) => ({
  platformId: raw.platformId || '',
  platform: raw.platform || 'unknown',
  title: (raw.title || '').trim(),
  price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price) || 0,
  originalPrice: raw.originalPrice ? parseFloat(raw.originalPrice) : null,
  currency: raw.currency || 'INR',
  rating: raw.rating ? Math.min(parseFloat(raw.rating), 5) : null,
  reviewCount: parseInt(raw.reviewCount, 10) || 0,
  images: Array.isArray(raw.images) ? raw.images.filter(Boolean) : [],
  url: raw.url || '',
  category: raw.category || '',
  brand: raw.brand || '',
  seller: raw.seller || null,
  availability: raw.availability !== false,
  reviews: raw.reviews || [],
});

const normalizeProducts = (products) => products.map(normalizeProduct).filter(p => p.price > 0);

/**
 * Compute relevance score (0-1) of a product against search query.
 * Uses keyword overlap: what fraction of query words appear in the title/brand.
 */
const computeRelevance = (product, query) => {
  if (!query) return 1;
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length === 0) return 1;
  const target = `${product.title} ${product.brand}`.toLowerCase();
  let matched = 0;
  for (const word of queryWords) {
    // Use word boundary regex to avoid partial matches (e.g. "rog" in "WROGN")
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (regex.test(target)) matched++;
  }
  return matched / queryWords.length;
};

/**
 * Filter products by relevance to query. Keeps only products where
 * at least half of the query words appear in the product title/brand.
 * Also sorts by relevance (best matches first).
 */
const filterByRelevance = (products, query) => {
  if (!query) return products;
  const scored = products.map(p => ({ ...p, _relevance: computeRelevance(p, query) }));
  // Require at least 50% of query words to match
  const threshold = 0.5;
  const filtered = scored.filter(p => p._relevance >= threshold);
  // Sort by relevance descending, then by reviewCount as tiebreaker
  filtered.sort((a, b) => b._relevance - a._relevance || (b.reviewCount || 0) - (a.reviewCount || 0));
  // Remove internal _relevance field
  return filtered.map(({ _relevance, ...p }) => p);
};

const similarity = (a, b) => {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size; // Jaccard similarity
};

const deduplicateProducts = (products) => {
  const unique = [];
  const seen = new Set();

  for (const product of products) {
    const key = `${product.platform}:${product.platformId}`;
    if (seen.has(key)) continue;

    // Check for cross-platform duplicates (same product on different platforms)
    const isDuplicate = unique.some(existing => {
      if (existing.platform === product.platform) return false;
      const priceDiff = Math.abs(existing.price - product.price) / Math.max(existing.price, product.price, 1);
      const titleSim = similarity(existing.title, product.title);
      return titleSim > 0.6 && priceDiff < 0.3;
    });

    if (!isDuplicate) {
      seen.add(key);
      unique.push(product);
    } else {
      // Keep as variant if from different platform
      const existing = unique.find(e =>
        e.platform !== product.platform &&
        similarity(e.title, product.title) > 0.6
      );
      if (existing && !existing.variants) {
        existing.variants = [{ platform: product.platform, price: product.price, url: product.url, platformId: product.platformId }];
      } else if (existing?.variants) {
        existing.variants.push({ platform: product.platform, price: product.price, url: product.url, platformId: product.platformId });
      }
    }
  }

  return unique;
};

module.exports = { normalizeProduct, normalizeProducts, deduplicateProducts, filterByRelevance };
