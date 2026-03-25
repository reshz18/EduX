const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'course_enrolled',
      'lesson_started',
      'lesson_completed',
      'course_completed',
      'video_engagement_heartbeat',
      'spin_reward_used',
      'certificate_generated',
      'quiz_attempted',
      'note_created'
    ]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
