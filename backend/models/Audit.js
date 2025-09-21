const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['delete', 'override', 'bulk_create', 'admin_booking'],
    required: true
  },

  // Admin who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // User affected by the action (if applicable)
  affectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Snapshot of the booking before deletion/override
  bookingSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Reason for the action
  reason: {
    type: String,
    default: null
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // IP address for security tracking
  ipAddress: {
    type: String,
    default: null
  },

  // User agent for security tracking
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
auditSchema.index({ performedBy: 1, createdAt: -1 });
auditSchema.index({ affectedUser: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('Audit', auditSchema);