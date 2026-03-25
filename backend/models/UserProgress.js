const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  chaptersCompleted: [{
    chapterId: String,
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number // in minutes
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastWatchedTime: {
    type: Number,
    default: 0 // in seconds
  },
  totalWatchTime: {
    type: Number,
    default: 0 // in seconds
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'F']
  },
  quizScores: [{
    chapterId: String,
    score: Number,
    maxScore: Number,
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index for efficient queries
userProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);