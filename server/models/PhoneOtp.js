const mongoose = require('mongoose');

const phoneOtpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date
  },
  usedForBooking: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('PhoneOtp', phoneOtpSchema);
