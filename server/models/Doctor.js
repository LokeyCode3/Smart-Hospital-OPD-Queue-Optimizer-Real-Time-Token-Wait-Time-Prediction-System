const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  avgConsultTime: {
    type: Number, // in minutes
    required: true,
    default: 10
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 500 // Default fee
  },
  active: {
    type: Boolean,
    default: true
  },
  consultationHistory: [{
    duration: Number,
    timestamp: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
