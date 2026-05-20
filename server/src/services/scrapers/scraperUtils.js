const ABSOLUTE_URL_RE = /^https?:\/\//i;

const parsePrice = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/rs\.?|inr|₹/gi, '')
    .replace(/,/g, '')
    .match(/\d+(?:\.\d+)?/);
  return cleaned ? Math.round(parseFloat(cleaned[0])) : 0;
};

const parseCount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;
  if (!value) return 0;

  const text = String(value).replace(/[()]/g, '').replace(/,/g, '').trim();
  const match = text.match(/(\d+(?:\.\d+)?)\s*([kmb])?/i);
  if (!match) return 0;

  const base = parseFloat(match[1]);
  const multiplier = { k: 1000, m: 1000000, b: 1000000000 }[match[2]?.toLowerCase()] || 1;
  return Math.round(base * multiplier);
};

const parseRating = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.min(value, 5) : null;
  if (!value) return null;
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const rating = parseFloat(match[1]);
  return rating > 0 ? Math.min(rating, 5) : null;
};

const absoluteUrl = (base, href) => {
  if (!href) return '';
  if (ABSOLUTE_URL_RE.test(href)) return href;
  return `${base}${href.startsWith('/') ? '' : '/'}${href}`;
};

const compactText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const waitForAnySelector = async (page, selectors, timeout = 10000) => {
  await Promise.race(
    selectors.map(selector => page.waitForSelector(selector, { timeout }))
  ).catch(() => {});
};

module.exports = {
  absoluteUrl,
  compactText,
  parseCount,
  parsePrice,
  parseRating,
  waitForAnySelector,
};
