import { motion } from 'framer-motion';
import { FiThumbsUp, FiThumbsDown, FiTrendingUp } from 'react-icons/fi';

export default function SentimentPanel({ sentiment, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!sentiment) return null;

  const sentimentColor = {
    positive: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', gauge: '#22c55e' },
    neutral: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', gauge: '#eab308' },
    negative: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', gauge: '#ef4444' },
  }[sentiment.overallSentiment] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', gauge: '#6b7280' };

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (sentiment.score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-6 ${sentimentColor.bg} ${sentimentColor.border}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiTrendingUp className="w-5 h-5" />
        AI Sentiment Analysis
      </h3>

      <div className="flex items-start gap-6">
        {/* Gauge */}
        <div className="shrink-0">
          <svg width="110" height="110" className="-rotate-90">
            <circle cx="55" cy="55" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <motion.circle
              cx="55" cy="55" r="45"
              fill="none"
              stroke={sentimentColor.gauge}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="text-center -mt-[72px]">
            <div className={`text-2xl font-bold ${sentimentColor.text}`}>{sentiment.score}</div>
            <div className="text-xs text-gray-500">/ 100</div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className={`inline-block text-sm font-medium px-3 py-1 rounded-full mb-3 ${sentimentColor.bg} ${sentimentColor.text}`}>
            {sentiment.overallSentiment?.charAt(0).toUpperCase() + sentiment.overallSentiment?.slice(1)} Sentiment
          </div>

          {sentiment.summary && (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{sentiment.summary}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pros */}
            {sentiment.pros?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <FiThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Pros</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sentiment.pros.map((pro, i) => (
                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{pro}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Cons */}
            {sentiment.cons?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <FiThumbsDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Cons</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sentiment.cons.map((con, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{con}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sentiment.reviewCount > 0 && (
            <p className="text-xs text-gray-400 mt-3">Based on {sentiment.reviewCount} reviews</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
