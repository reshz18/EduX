const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special'],
    default: 'daily'
  },
  reward: {
    points: {
      type: Number,
      default: 0
    },
    badge: String,
    other: String
  },
  requirements: {
    action: {
      type: String,
      required: true // e.g., 'complete_course', 'login_streak', 'community_post'
    },
    target: {
      type: Number,
      default: 1 // e.g., complete 3 courses, 7 day streak
    },
    timeframe: {
      type: Number, // in hours
      default: 24
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  completedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema);