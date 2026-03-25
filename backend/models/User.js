const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['STUDENT', 'EDUCATOR', 'ADMIN'],
    default: 'STUDENT'
  },
  avatar: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 0
  },
  lastSpinAt: {
    type: Date,
    default: null
  },
  totalSpins: {
    type: Number,
    default: 0
  },
  spinStreak: {
    type: Number,
    default: 0
  },
  coursesCompleted: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 100
    }
  }],
  coursesEnrolled: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
  }],
  badges: [{
    name: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  phone: String,
  bio: String,
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  skills: [{
    type: String,
    trim: true
  }],
  educationLevel: {
    type: String,
    enum: ['High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Professional', 'Other'],
    default: 'Other'
  },
  interests: [{
    type: String,
    trim: true
  }],
  socialLinks: {
    github: String,
    linkedin: String,
    website: String
  },
  location: String,
  institution: String,
  teachingExperience: String,
  subjectsTaught: [{ type: String, trim: true }],
  isOnboarded: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);