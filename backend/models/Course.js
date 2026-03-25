const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoUrl: String,
  videoId: String, // YouTube video ID
  duration: Number, // duration in seconds
  description: String,
  order: {
    type: Number,
    required: true
  }
});

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // duration in seconds
    default: 0
  }
});

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number, // Index of correct option (0-3)
    required: true
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  instructorSignatureUrl: {
    type: String,
    // Optional initially, important for new courses needing certificates
  },
  thumbnail: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  price: {
    type: Number,
    default: 0
  },
  pointsRequired: {
    type: Number,
    default: 0
  },
  chapters: [chapterSchema],
  lessons: [lessonSchema], // New lessons array for video-based courses
  quizQuestions: [quizQuestionSchema], // MCQ quiz questions
  quizPassingScore: {
    type: Number,
    default: 80 // 80% = 8 out of 10 questions
  },
  totalDuration: Number, // Total duration in seconds
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['Public', 'Private', 'Unlisted'],
    default: 'Public'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);