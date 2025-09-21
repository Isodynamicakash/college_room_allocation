const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const auth = require('../middleware/auth');

// POST /api/bookings — Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received booking request:', req.body);

    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.fullName || null;

    const { building, floor, room, date, startTime, endTime, purpose } = req.body;

    if (!building || !floor || !room || !date || !startTime || !endTime || !purpose || !userId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    if ([startH, startM, endH, endM].some((v) => Number.isNaN(v))) {
      return res.status(400).json({ message: 'Invalid time format' });
    }

    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration <= 0) {
      return res.status(400).json({ message: 'Invalid time range. End time must be after start time.' });
    }

    const conflict = await Booking.findOne({
      room,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (conflict) {
      return res.status(409).json({ message: 'Room already booked for this time slot' });
    }

    const booking = await Booking.create({
      building,
      floor,
      room,
      date,
      startTime,
      endTime,
      bookedBy: userId,
      bookedByName: userName,
      purpose
    });

    const populated = await Booking.findById(booking._id).populate('bookedBy', '_id name');

    res.status(201).json({
      message: 'Room booked successfully',
      booking: populated.toClient ? populated.toClient() : populated
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// DELETE /api/bookings/:id — Cancel a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const ownerId = booking.bookedBy?.toString?.() || String(booking.bookedBy);
    const requesterId = String(req.user.id);

    if (ownerId !== requesterId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking' });
    }

    await booking.deleteOne();

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('bookingUpdate', { date: booking.date });
      }
    } catch (emitErr) {
      console.warn('Failed to emit bookingUpdate event:', emitErr);
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Cancellation error:', err);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
});

module.exports = router;