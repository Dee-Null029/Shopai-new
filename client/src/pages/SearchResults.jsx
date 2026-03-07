import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import ProductList from '../components/ProductList';
import RankingControls from '../components/RankingControls';
import SearchBar from '../components/SearchBar';
import { FiSliders, FiGrid, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useRanking, setUseRanking] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState({ price: 0.25, rating: 0.25, sentiment: 0.25, reliability: 0.25 });
  const [sortBy, setSortBy] = useState('relevance');
  const [platforms, setPlatforms] = useState(['amazon', 'flipkart', 'myntra']);

  useEffect(() => {
    if (query) fetchResults();
  }, [query, sortBy, platforms, useRanking, weights]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      if (useRanking) {
        const { data } = await api.get('/ranking', {
          params: { q: query, wPrice: weights.price, wRating: weights.rating, wSentiment: weights.sentiment, wReliability: weights.reliability },
        });
        setProducts(data.data.products || []);
      } else {
        const { data } = await api.get('/search', {
          params: { q: query, sortBy, platforms: platforms.join(',') },
        });
        setProducts(data.data.products || []);
      }
    } catch (err) {
      toast.error('Search failed. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (p) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Search bar on results page */}
      <div className="mb-8">
        <SearchBar />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-72 shrink-0 space-y-6">
          {/* Platform filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Platforms</h3>
            {['amazon', 'flipkart', 'myntra'].map(p => (
              <label key={p} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={platforms.includes(p)}
                  onChange={() => togglePlatform(p)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 capitalize">{p}</span>
              </label>
            ))}
          </div>

          {/* Sort */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>

          {/* Smart Ranking toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">AI Smart Ranking</h3>
              <button
                onClick={() => setUseRanking(!useRanking)}
                className={`w-11 h-6 rounded-full transition-colors ${useRanking ? 'bg-brand-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${useRanking ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-xs text-gray-500">Uses AI to analyze reviews and rank products by composite score</p>

            {useRanking && (
              <button
                onClick={() => setShowWeights(!showWeights)}
                className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                <FiSliders className="w-4 h-4" />
                {showWeights ? 'Hide' : 'Customize'} weights
              </button>
            )}
          </div>

          {useRanking && showWeights && (
            <RankingControls weights={weights} onChange={setWeights} />
          )}
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {query ? `Results for "${query}"` : 'Search Results'}
              </h1>
              {products.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">{products.length} products found</p>
              )}
            </div>
          </div>

          <ProductList products={products} loading={loading} showRank={useRanking} />
        </div>
      </div>
    </div>
  );
}
