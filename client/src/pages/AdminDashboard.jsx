import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../services/api';
import { FiMousePointer, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#f59e0b', '#ec4899'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/affiliate/analytics', { params: { days } });
      setAnalytics(data.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const platformData = analytics?.byPlatform
    ? Object.entries(analytics.byPlatform).map(([name, clicks]) => ({ name, clicks }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
          <p className="text-gray-500 mt-1">Track clicks, conversions, and revenue</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="input-field w-auto"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FiMousePointer className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Total Clicks</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics?.totalClicks?.toLocaleString() || 0}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Platforms Active</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{platformData.length}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Avg Daily Clicks</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics?.totalClicks ? Math.round(analytics.totalClicks / days) : 0}
              </p>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily clicks line chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Daily Clicks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.dailyClicks || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Platform breakdown pie chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Clicks by Platform</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="clicks"
                    nameKey="name"
                    label={({ name, clicks }) => `${name}: ${clicks}`}
                  >
                    {platformData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent clicks */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Recent Clicks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Platform</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics?.recentClicks?.map((click, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-800">{click.productTitle || 'Unknown'}</td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full capitalize bg-gray-100 text-gray-600">
                          {click.platform}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(click.clickedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(!analytics?.recentClicks || analytics.recentClicks.length === 0) && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-400">No clicks recorded yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
