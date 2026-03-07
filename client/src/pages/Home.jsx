import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { FiSearch, FiTrendingUp, FiMessageCircle, FiBox, FiShield, FiZap } from 'react-icons/fi';

const features = [
  { icon: FiSearch, title: 'Multi-Platform Search', desc: 'Search Amazon, Flipkart & Myntra simultaneously. Compare prices across platforms in real-time.' },
  { icon: FiTrendingUp, title: 'AI Sentiment Analysis', desc: 'GPT-4 analyzes customer reviews to extract pros, cons, and overall sentiment scores.' },
  { icon: FiZap, title: 'Smart Ranking', desc: 'Composite scores based on price, ratings, sentiment & reliability — with adjustable weights.' },
  { icon: FiBox, title: '3D Virtual Try-On', desc: 'Try on clothes virtually with our 3D body model. Adjust measurements for perfect fit visualization.' },
  { icon: FiMessageCircle, title: 'AI Fashion Chatbot', desc: 'Get personalized outfit recommendations and shopping guidance from our AI stylist.' },
  { icon: FiShield, title: 'Unbiased Rankings', desc: 'Product rankings are never influenced by affiliate commissions. Transparency guaranteed.' },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Shop Smarter with
              <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                AI-Powered Insights
              </span>
            </h1>
            <p className="text-lg md:text-xl text-brand-100 max-w-2xl mx-auto mb-10">
              Search across Amazon, Flipkart & Myntra. Get AI sentiment analysis, smart rankings,
              3D virtual try-on, and personalized fashion advice — all in one place.
            </p>

            <SearchBar large />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered by AI, Built for You</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Every feature is designed to help you make better shopping decisions, faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 hover:border-brand-200"
            >
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Try It On?</h2>
          <p className="text-gray-400 mb-8">
            Experience our 3D virtual try-on feature. See how clothes look before you buy.
          </p>
          <Link to="/try-on" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Launch 3D Try-On
          </Link>
        </div>
      </section>
    </div>
  );
}
