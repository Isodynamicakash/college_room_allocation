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
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Booking', bookingSchema);