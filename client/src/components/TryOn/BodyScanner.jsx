import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import useBodyScanner from '../../hooks/useBodyScanner';

export default function BodyScanner({ onMeasurements, onClose }) {
  const {
    videoRef,
    canvasRef,
    isScanning,
    isLoading,
    error,
    measurements,
    currentLandmarks,
    referenceHeight,
    setReferenceHeight,
    startScanning,
    stopScanning,
    captureMeasurements,
  } = useBodyScanner();

  const [captured, setCaptured] = useState(false);

  const handleCapture = () => {
    const result = captureMeasurements();
    if (result) setCaptured(true);
  };

  const handleApply = () => {
    if (measurements) {
      onMeasurements(measurements);
      stopScanning();
      onClose();
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Body Scanner</h3>
            <p className="text-xs text-gray-500">Stand 2-3m from camera, full body visible</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Guide overlay when not scanning */}
          {!isScanning && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
              <div className="border-2 border-dashed border-cyan-400 rounded-xl w-40 h-72 mb-4 flex items-center justify-center opacity-60">
                <svg viewBox="0 0 80 140" className="w-20 h-36 text-cyan-400">
                  <circle cx="40" cy="18" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="40" y1="28" x2="40" y2="80" stroke="currentColor" strokeWidth="2" />
                  <line x1="40" y1="45" x2="20" y2="65" stroke="currentColor" strokeWidth="2" />
                  <line x1="40" y1="45" x2="60" y2="65" stroke="currentColor" strokeWidth="2" />
                  <line x1="40" y1="80" x2="25" y2="130" stroke="currentColor" strokeWidth="2" />
                  <line x1="40" y1="80" x2="55" y2="130" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-white text-sm mb-1">Position your full body in frame</p>
              <p className="text-gray-400 text-xs">Works best with tight-fitting clothes</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white text-sm">Loading pose model...</p>
                <p className="text-gray-400 text-xs mt-1">First time may take a few seconds</p>
              </div>
            </div>
          )}

          {/* Tracking indicator */}
          {isScanning && (
            <div className="absolute top-3 left-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                currentLandmarks ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'
              }`}>
                <span className={`w-2 h-2 rounded-full ${currentLandmarks ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
                {currentLandmarks ? 'Body Detected' : 'Searching...'}
              </div>
            </div>
          )}
        </div>

        {/* Height Reference Input */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Your Height (reference)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="140"
                max="210"
                value={referenceHeight}
                onChange={(e) => setReferenceHeight(Math.max(140, Math.min(210, parseInt(e.target.value) || 170)))}
                className="w-16 text-center text-sm font-bold border border-gray-300 rounded-lg py-1 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">cm</span>
            </div>
          </label>
          <p className="text-xs text-gray-400 mt-1">
            We use your height to calculate other measurements accurately.
          </p>
        </div>

        {/* Measurement Results */}
        <AnimatePresence>
          {captured && measurements && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 bg-cyan-50">
                <p className="text-sm font-semibold text-cyan-800 mb-3">Detected Measurements</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Chest', value: measurements.chest },
                    { label: 'Waist', value: measurements.waist },
                    { label: 'Hip', value: measurements.hip },
                    { label: 'Shoulder', value: measurements.shoulder },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="text-lg font-bold text-cyan-700">{m.value}</div>
                      <div className="text-xs text-gray-500">{m.label} cm</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <span>Body type: <strong className="text-cyan-700 capitalize">{measurements.bodyType}</strong></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <div className="px-5 py-3 bg-red-50 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FiCamera className="w-4 h-4" />
              Start Camera
            </button>
          ) : !captured ? (
            <>
              <button onClick={handleClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCapture}
                disabled={!currentLandmarks}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiCamera className="w-4 h-4" />
                Capture
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCaptured(false)}
                className="btn-secondary flex-1"
              >
                Retake
              </button>
              <button
                onClick={handleApply}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <FiCheck className="w-4 h-4" />
                Apply Measurements
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
