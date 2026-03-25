const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lessonId: {
    type: String, // String ID for chapters/lessons within course
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lastWatchedTime: {
    type: Number,
    default: 0 // current playback position in seconds
  },
  totalWatchTime: {
    type: Number,
    default: 0 // accumulated time in seconds
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
lessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
