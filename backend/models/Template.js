const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },

  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true
  },

  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },

  // Day of week (0=Sunday, 1=Monday, etc.)
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },

  startTime: {
    type: String,
    required: true // Format: HH:mm
  },

  endTime: {
    type: String,
    required: true // Format: HH:mm
  },

  teacher: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  department: {
    type: String,
    enum: ['AIML', 'IT', 'AI', 'CSE CORE', 'DS'],
    required: true
  },

  // Admin who created this template
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Whether this template allows overriding existing bookings
  overrideAllowed: {
    type: Boolean,
    default: false
  },

  // Whether template is active
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
templateSchema.index({ building: 1, floor: 1, room: 1, dayOfWeek: 1 });
templateSchema.index({ createdBy: 1 });
templateSchema.index({ department: 1 });

module.exports = mongoose.model('Template', templateSchema);