const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { estimateBodyFromImage } = require('../services/bodyEstimator');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/tryon');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/estimate-body', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Image file is required', 400));
    }

    const bodyParams = await estimateBodyFromImage(req.file.path);

    // Clean up uploaded file after processing
    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      data: bodyParams,
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// Get available garment models
router.get('/garments', async (req, res) => {
  const garments = [
    { id: 'tshirt-basic', name: 'Basic T-Shirt', category: 'tops', modelFile: 'tshirt-basic.glb', colors: ['#ffffff', '#000000', '#1e40af', '#dc2626', '#059669'] },
    { id: 'shirt-formal', name: 'Formal Shirt', category: 'tops', modelFile: 'shirt-formal.glb', colors: ['#ffffff', '#dbeafe', '#fef3c7'] },
    { id: 'jeans-slim', name: 'Slim Fit Jeans', category: 'bottoms', modelFile: 'jeans-slim.glb', colors: ['#1e3a5f', '#000000', '#6b7280'] },
    { id: 'dress-casual', name: 'Casual Dress', category: 'dresses', modelFile: 'dress-casual.glb', colors: ['#be123c', '#000000', '#7c3aed', '#0891b2'] },
    { id: 'jacket-bomber', name: 'Bomber Jacket', category: 'jackets', modelFile: 'jacket-bomber.glb', colors: ['#000000', '#1c1917', '#365314'] },
    { id: 'hoodie-basic', name: 'Basic Hoodie', category: 'tops', modelFile: 'hoodie-basic.glb', colors: ['#6b7280', '#000000', '#1e40af', '#dc2626'] },
  ];

  res.json({ success: true, data: garments });
});

module.exports = router;
