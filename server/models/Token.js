const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  reason: {
    type: String
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  patientAge: {
    type: Number
  },
  patientGender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  patientMobile: {
    type: String
  },
  priority: {
    type: String,
    enum: ['NORMAL', 'EMERGENCY'],
    default: 'NORMAL'
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'NA'],
    default: 'NA'
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  status: {
    type: String,
    enum: ['WAITING', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'DONE', 'NO_SHOW'],
    default: 'WAITING'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  }
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
