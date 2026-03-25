const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastWatchedTime: {
    type: Number,
    default: 0 // in seconds
  },
  videoCompleted: {
    type: Boolean,
    default: false // True when video is 100% watched
  },
  completed: {
    type: Boolean,
    default: false // True only after passing quiz
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  totalWatchTime: {
    type: Number,
    default: 0 // in seconds
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);