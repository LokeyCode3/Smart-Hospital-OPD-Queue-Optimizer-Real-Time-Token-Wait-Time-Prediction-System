const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    type: Object
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
