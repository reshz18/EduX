const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
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
  answers: [{
    questionIndex: Number,
    selectedOption: Number
  }],
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
quizAttemptSchema.index({ userId: 1, courseId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
