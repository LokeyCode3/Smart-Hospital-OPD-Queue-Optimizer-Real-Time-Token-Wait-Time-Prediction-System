const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DOCTOR', 'PATIENT'],
    default: 'PATIENT'
  },
  mobile: {
    type: String
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  noShowCount: {
    type: Number,
    default: 0
  },
  bookingCooldownUntil: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetPasswordAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastPasswordResetAt: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
