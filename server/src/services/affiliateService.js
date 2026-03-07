const config = require('../config/env');

const ALLOWED_DOMAINS = [
  'amazon.in', 'www.amazon.in',
  'flipkart.com', 'www.flipkart.com',
  'myntra.com', 'www.myntra.com',
];

const generateAffiliateUrl = (platform, productUrl) => {
  // Validate URL domain to prevent open redirect
  let parsed;
  try {
    parsed = new URL(productUrl);
  } catch {
    return null;
  }
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) return null;

  switch (platform) {
    case 'amazon': {
      const tag = config.affiliate.amazon.tag;
      if (!tag) return productUrl;
      const url = new URL(productUrl);
      url.searchParams.set('tag', tag);
      url.searchParams.set('linkCode', 'ogi');
      url.searchParams.set('th', '1');
      return url.toString();
    }
    case 'flipkart': {
      const affId = config.affiliate.flipkart.id;
      if (!affId) return productUrl;
      const url = new URL(productUrl);
      url.searchParams.set('affid', affId);
      return url.toString();
    }
    case 'myntra': {
      const affId = config.affiliate.myntra.id;
      if (!affId) return productUrl;
      const url = new URL(productUrl);
      url.searchParams.set('utm_source', affId);
      url.searchParams.set('utm_medium', 'affiliate');
      return url.toString();
    }
    default:
      return productUrl;
  }
};

module.exports = { generateAffiliateUrl };
