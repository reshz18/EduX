const mongoose = require('mongoose');

const spinHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardType: {
    type: String,
    enum: ['points', 'bonus_xp', 'double_points', 'mystery_reward', 'streak_bonus'],
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true
  },
  rewardLabel: {
    type: String,
    required: true
  },
  spinDate: {
    type: Date,
    default: Date.now
  },
  isStreakBonus: {
    type: Boolean,
    default: false
  },
  streakDay: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
spinHistorySchema.index({ userId: 1, spinDate: -1 });
spinHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SpinHistory', spinHistorySchema);