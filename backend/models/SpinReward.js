const mongoose = require('mongoose');

const spinRewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardType: {
    type: String,
    enum: ['points', 'badge', 'course_access', 'premium_feature'],
    required: true
  },
  rewardValue: {
    points: Number,
    badgeName: String,
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    featureName: String
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  claimedAt: Date,
  isClaimed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const userSpinHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastSpinAt: {
    type: Date,
    default: Date.now
  },
  spinsToday: {
    type: Number,
    default: 0
  },
  totalSpins: {
    type: Number,
    default: 0
  },
  rewards: [{
    rewardType: String,
    rewardValue: mongoose.Schema.Types.Mixed,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const SpinReward = mongoose.model('SpinReward', spinRewardSchema);
const UserSpinHistory = mongoose.model('UserSpinHistory', userSpinHistorySchema);

module.exports = { SpinReward, UserSpinHistory };