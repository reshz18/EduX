const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    email: {
      courseUpdates: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      courseReminders: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      messages: { type: Boolean, default: true }
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public'
    },
    showProgress: { type: Boolean, default: true },
    showBadges: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    autoplay: { type: Boolean, default: true },
    playbackSpeed: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);