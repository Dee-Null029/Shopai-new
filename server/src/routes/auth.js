const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(128),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
  return { accessToken, refreshToken };
};

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError('Email already registered', 400));

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Cap refresh tokens to 10 most recent
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } },
    });

    res.status(201).json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email }, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    // Cap refresh tokens to 10 most recent
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } },
    });

    res.json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email }, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required', 400));

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Rotate refresh token
    const tokens = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json({ success: true, data: tokens });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid refresh token', 401));
    }
    next(err);
  }
});

router.post('/logout', auth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user.id, { $pull: { refreshTokens: refreshToken } });
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, preferences: user.preferences } });
  } catch (err) { next(err); }
});

module.exports = router;
