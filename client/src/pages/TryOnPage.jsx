import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TryOnViewer from '../components/TryOn/TryOnViewer';
import BodyConfigurator from '../components/TryOn/BodyConfigurator';
import BodyScanner from '../components/TryOn/BodyScanner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiCamera, FiRefreshCw, FiSmartphone } from 'react-icons/fi';

const garmentOptions = [
  { id: 'tops', label: 'Tops', colors: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'] },
  { id: 'bottoms', label: 'Bottoms', colors: ['#1e3a5f', '#000000', '#6b7280', '#92400e', '#365314'] },
  { id: 'dress', label: 'Dresses', colors: ['#be123c', '#7c3aed', '#0891b2', '#000000', '#d97706'] },
];

export default function TryOnPage() {
  const [bodyParams, setBodyParams] = useState({ height: 170, chest: 95, waist: 80, hip: 95 });
  const [garmentColor, setGarmentColor] = useState('#3b82f6');
  const [selectedCategory, setSelectedCategory] = useState('tops');
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const { data } = await api.post('/tryon/estimate-body', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBodyParams(data.data);
      toast.success(`Body estimated (${data.data.confidence}% confidence)`);
    } catch {
      toast.error('Failed to estimate body measurements. Please adjust manually.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Virtual Try-On</h1>
        <p className="text-gray-500 mb-8">Visualize how clothes look on your body type before buying.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3D Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 600 }}>
            <TryOnViewer bodyParams={bodyParams} garmentColor={garmentColor} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Drag to rotate • Scroll to zoom • Shift+drag to pan
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Photo upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Auto-Detect Body</h3>
            <p className="text-xs text-gray-500 mb-3">Scan with your camera or upload a photo to auto-detect measurements.</p>

            {/* Camera scan button */}
            <button
              onClick={() => setShowScanner(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-2"
            >
              <FiSmartphone className="w-4 h-4" />
              Scan with Camera
            </button>

            {/* Photo upload fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><FiRefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><FiUpload className="w-4 h-4" /> Upload Photo</>
              )}
            </button>
          </div>

          {/* Body measurements */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Body Measurements</h3>
            <BodyConfigurator params={bodyParams} onChange={setBodyParams} />
          </div>

          {/* Garment selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Garment</h3>

            {/* Category */}
            <div className="flex gap-2 mb-4">
              {garmentOptions.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {garmentOptions.find(g => g.id === selectedCategory)?.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setGarmentColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    garmentColor === color ? 'border-brand-600 scale-110 shadow-md' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <BodyScanner
            onMeasurements={(m) => {
              setBodyParams(m);
              toast.success(`Body scanned! (${m.bodyType} build)`);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
