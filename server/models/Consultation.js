const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for guest patients (though our flow usually has users)
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  visitReason: {
    type: String
  },
  problemCategory: {
    type: String,
    enum: ['Fever', 'Cold', 'Headache', 'Injury', 'Others'],
    default: 'Others'
  },
  doctorNotes: {
    type: String
  },
  consultationStartTime: {
    type: Date
  },
  consultationEndTime: {
    type: Date
  },
  consultationDuration: {
    type: Number // in minutes
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
