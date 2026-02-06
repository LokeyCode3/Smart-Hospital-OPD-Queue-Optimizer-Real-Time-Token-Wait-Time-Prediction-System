const mongoose = require('mongoose');

const consultationOtpSchema = new mongoose.Schema({
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true,
    index: true,
    unique: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  otpGeneratedAt: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('ConsultationOtp', consultationOtpSchema);
