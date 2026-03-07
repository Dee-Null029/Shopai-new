import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';

const trendingSearches = ['Casual T-Shirts', 'Ethnic Wear', 'Running Shoes', 'Denim Jackets', 'Summer Dresses', 'Formal Shirts'];

export default function SearchBar({ large = false }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className={large ? 'w-full max-w-2xl mx-auto' : ''}>
      <form onSubmit={handleSearch} className="relative">
        <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for clothing, shoes, accessories across Amazon, Flipkart & Myntra..."
          className={`w-full bg-white text-gray-900 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${large ? 'pl-14 pr-6 py-4 text-lg' : 'pl-10 pr-4 py-3'}`}
        />
        <button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 btn-primary ${large ? 'px-8 py-2.5' : 'px-4 py-1.5 text-sm'}`}>
          Search
        </button>
      </form>

      {large && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FiTrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Trending:</span>
          {trendingSearches.map((term) => (
            <motion.button
              key={term}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setQuery(term); navigate(`/search?q=${encodeURIComponent(term)}`); }}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              {term}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
