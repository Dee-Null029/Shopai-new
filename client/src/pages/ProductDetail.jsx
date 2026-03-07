import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import SentimentPanel from '../components/SentimentPanel';
import { FiStar, FiExternalLink, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const platformNames = { amazon: 'Amazon', flipkart: 'Flipkart', myntra: 'Myntra' };

export default function ProductDetail() {
  const { platform, id } = useParams();
  const [product, setProduct] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [platform, id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/product/${platform}/${id}`);
      setProduct(data.data);
      fetchSentiment();
    } catch {
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentiment = async () => {
    setSentimentLoading(true);
    try {
      const { data } = await api.get(`/sentiment/${platform}/${id}`);
      setSentiment(data.data);
    } catch {
      // Sentiment analysis optional — don't show error
    } finally {
      setSentimentLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!product?.url) return;
    // Redirect through affiliate
    const affiliateUrl = `/api/affiliate/redirect/buy?url=${encodeURIComponent(product.url)}&platform=${platform}&productId=${id}&title=${encodeURIComponent(product.title || '')}`;
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Product not found</p>
        <Link to="/" className="text-brand-600 hover:underline mt-2 inline-block">Back to Home</Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
        <FiArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-50 flex items-center justify-center p-8">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400">No Image</span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-brand-500' : 'border-gray-200'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <span className="text-sm font-medium text-brand-600">
              {platformNames[platform] || platform}
            </span>
            {product.brand && (
              <span className="text-sm text-gray-500 ml-2">by {product.brand}</span>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mt-1 leading-snug">{product.title}</h1>
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                <FiStar className="w-5 h-5 text-green-600 fill-current" />
                <span className="font-bold text-green-700">{product.rating}</span>
              </div>
              <span className="text-gray-500">{product.reviewCount?.toLocaleString()} reviews</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  ₹{product.originalPrice?.toLocaleString('en-IN')}
                </span>
                <span className="text-lg font-semibold text-green-600">{discount}% off</span>
              </>
            )}
          </div>

          {/* Availability */}
          <div className={`text-sm font-medium ${product.availability ? 'text-green-600' : 'text-red-500'}`}>
            {product.availability ? '✓ In Stock' : '✗ Out of Stock'}
          </div>

          {/* Buy buttons */}
          <div className="flex gap-3">
            <button onClick={handleBuyNow} className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
              <FiShoppingCart className="w-5 h-5" />
              Buy on {platformNames[platform]}
            </button>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <FiExternalLink className="w-5 h-5" /> View Original
            </a>
          </div>

          {/* Try-on link for clothing */}
          <Link
            to="/try-on"
            className="inline-flex items-center gap-2 text-sm text-purple-600 hover:underline bg-purple-50 px-4 py-2 rounded-lg"
          >
            🧍 Try this on virtually in 3D
          </Link>
        </motion.div>
      </div>

      {/* Sentiment Analysis Section */}
      <div className="mt-10">
        <SentimentPanel sentiment={sentiment} loading={sentimentLoading} />
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
                    <FiStar className="w-3.5 h-3.5 text-green-600 fill-current" />
                    <span className="text-sm font-medium text-green-700">{review.rating}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{review.author}</span>
                  {review.verified && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Verified</span>}
                </div>
                {review.title && <p className="font-medium text-gray-800 mb-1">{review.title}</p>}
                <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
