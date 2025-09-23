const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  date: {
    type: String,
    required: true // Format: YYYY-MM-DD
  },
  startTime: {
    type: String,
    required: true // Format: HH:mm
  },
  endTime: {
    type: String,
    required: true // Format: HH:mm
  },

  // Canonical reference to the user who booked
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Optional snapshot of user's name at time of booking
  bookedByName: {
    type: String,
    default: null
  },

  purpose: {
    type: String,
    required: true
  },

  // Admin fields for enhanced booking management
  source: {
    type: String,
    enum: ['user', 'admin', 'template'],
    default: 'user'
  },

  teacher: {
    type: String,
    default: null
  },

  subject: {
    type: String,
    default: null
  },

  department: {
    type: String,
    enum: ['AIML', 'IT', 'AI', 'CSE CORE', 'DS', 'CDC'],
    default: null
  },

  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    default: null
  },

  overrideAllowed: {
    type: Boolean,
    default: false
  },

  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for faster queries
bookingSchema.index({ room: 1, date: 1 });
bookingSchema.index({ bookedBy: 1, date: 1 });

// Method to return consistent frontend-friendly shape
bookingSchema.methods.toClient = function () {
  let bookedByObj = null;

  if (this.populated && this.populated('bookedBy')) {
    const u = this.bookedBy;
    bookedByObj = {
      _id: u._id ? String(u._id) : null,
      name: u.name || this.bookedByName || null
    };
  } else if (this.bookedBy && typeof this.bookedBy === 'object' && (this.bookedBy._id || this.bookedBy.id)) {
    bookedByObj = {
      _id: String(this.bookedBy._id || this.bookedBy.id),
      name: this.bookedBy.name || this.bookedByName || null
    };
  } else if (this.bookedBy) {
    bookedByObj = {
      _id: String(this.bookedBy),
      name: this.bookedByName || null
    };
  }

  return {
    _id: String(this._id),
    date: this.date,
    startTime: this.startTime,
    endTime: this.endTime,
    purpose: this.purpose,
    bookedBy: bookedByObj,
    bookedByName: this.bookedByName || (bookedByObj && bookedByObj.name) || null,
    teacher: this.teacher,
    subject: this.subject,
    department: this.department,
    source: this.source,
    overrideAllowed: this.overrideAllowed,
    createdByAdmin: this.createdByAdmin,
    templateId: this.templateId,
    // Include populated fields if available
    building: this.building && (typeof this.building === 'object' && this.building.name)
      ? { _id: String(this.building._id), name: this.building.name }
      : String(this.building),
    floor: this.floor && (typeof this.floor === 'object' && this.floor.number !== undefined)
      ? { _id: String(this.floor._id), number: this.floor.number }
      : String(this.floor),
    room: this.room && (typeof this.room === 'object' && this.room.number)
      ? { _id: String(this.room._id), number: this.room.number }
      : String(this.room),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Booking', bookingSchema);