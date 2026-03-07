import { motion } from 'framer-motion';

export default function RankingControls({ weights, onChange }) {
  const labels = {
    price: { label: 'Price', desc: 'How much cheaper is better', color: 'bg-green-500' },
    rating: { label: 'Rating', desc: 'Customer star ratings', color: 'bg-yellow-500' },
    sentiment: { label: 'Sentiment', desc: 'AI review analysis score', color: 'bg-blue-500' },
    reliability: { label: 'Reliability', desc: 'Platform trust & seller quality', color: 'bg-purple-500' },
  };

  const handleChange = (key, value) => {
    const newWeights = { ...weights, [key]: value };
    // Normalize so they sum to 1
    const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(newWeights).forEach(k => { newWeights[k] = newWeights[k] / total; });
    }
    onChange(newWeights);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Customize Ranking Weights</h3>
      <div className="space-y-4">
        {Object.entries(labels).map(([key, meta]) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                <span className="text-xs text-gray-400 ml-2">{meta.desc}</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{Math.round((weights[key] || 0.25) * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${meta.color}`} />
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((weights[key] || 0.25) * 100)}
                onChange={(e) => handleChange(key, parseInt(e.target.value) / 100)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
