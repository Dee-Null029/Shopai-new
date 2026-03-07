const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferences: {
    rankingWeights: {
      price: { type: Number, default: 0.25, min: 0, max: 1 },
      rating: { type: Number, default: 0.25, min: 0, max: 1 },
      sentiment: { type: Number, default: 0.25, min: 0, max: 1 },
      reliability: { type: Number, default: 0.25, min: 0, max: 1 },
    },
    bodyMeasurements: {
      height: Number,
      chest: Number,
      waist: Number,
      hip: Number,
    },
  },
  refreshTokens: [{ type: String, select: false }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
