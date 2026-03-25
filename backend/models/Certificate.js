const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  userName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    required: true
  },
  instructorSignatureUrl: {
    type: String
  },
  qrCodeUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Generate certificate ID before saving
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    this.certificateId = `EDUX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);