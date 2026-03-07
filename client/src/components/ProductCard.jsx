import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiExternalLink } from 'react-icons/fi';

const platformColors = {
  amazon: 'bg-orange-100 text-orange-700',
  flipkart: 'bg-blue-100 text-blue-700',
  myntra: 'bg-pink-100 text-pink-700',
};

const platformNames = { amazon: 'Amazon', flipkart: 'Flipkart', myntra: 'Myntra' };

export default function ProductCard({ product, rank }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card group"
    >
      <Link to={`/product/${product.platform}/${product.platformId}`}>
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
          )}

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              #{rank}
            </div>
          )}

          {/* Composite score */}
          {product.compositeScore !== undefined && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-sm font-bold px-2 py-1 rounded-lg shadow-sm">
              <span className={product.compositeScore >= 70 ? 'text-green-600' : product.compositeScore >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                {product.compositeScore}/100
              </span>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discount}% OFF
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Platform tag */}
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${platformColors[product.platform] || 'bg-gray-100 text-gray-600'}`}>
            {platformNames[product.platform] || product.platform}
          </span>

          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug">{product.title}</h3>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-gray-900">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded">
                <FiStar className="w-3.5 h-3.5 text-green-600 fill-current" />
                <span className="text-sm font-medium text-green-700">{product.rating}</span>
              </div>
              <span className="text-xs text-gray-500">({product.reviewCount?.toLocaleString()} reviews)</span>
            </div>
          )}

          {/* Score breakdown */}
          {product.scores && (
            <div className="mt-3 grid grid-cols-4 gap-1 text-center">
              {Object.entries(product.scores).map(([key, val]) => (
                <div key={key} className="text-xs">
                  <div className="font-medium text-gray-600 capitalize">{key}</div>
                  <div className={`font-bold ${val >= 70 ? 'text-green-600' : val >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Platform variants */}
          {product.variants?.length > 0 && (
            <div className="mt-2 flex gap-1">
              <span className="text-xs text-gray-500">Also on:</span>
              {product.variants.map(v => (
                <span key={v.platform} className={`text-xs px-1.5 py-0.5 rounded ${platformColors[v.platform]}`}>
                  {platformNames[v.platform]} ₹{v.price?.toLocaleString('en-IN')}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
