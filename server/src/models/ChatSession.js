const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
  content: { type: String, required: true },
  productRecommendations: [{
    title: String,
    platform: String,
    price: Number,
    rating: Number,
    url: String,
    image: String,
  }],
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Chat' },
  messages: {
    type: [messageSchema],
    validate: [arr => arr.length <= 500, 'Chat session cannot exceed 500 messages'],
  },
  context: {
    stylePreferences: [String],
    recentProducts: [String],
    occasion: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
