const mongoose = require('mongoose');

const platformSignatureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'EduX CEO'
  },
  signatureUrl: {
    type: String,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlatformSignature', platformSignatureSchema);
