const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Audit = require('../models/Audit');
const auth = require('../middleware/auth');

// POST /api/bookings — Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received booking request:', req.body);

    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.fullName || null;

    const { building, floor, room, date, startTime, endTime, purpose, teacher, subject, department } = req.body;

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
      purpose,
      source: 'user', // Regular user booking
      teacher: teacher || null,
      subject: subject || null,
      department: department || null
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
    const booking = await Booking.findById(req.params.id).populate('bookedBy', '_id name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Handle ObjectId comparison properly
    let ownerId;
    if (booking.bookedBy && typeof booking.bookedBy === 'object' && booking.bookedBy._id) {
      ownerId = String(booking.bookedBy._id);
    } else if (booking.bookedBy) {
      ownerId = String(booking.bookedBy);
    } else {
      return res.status(500).json({ message: 'Booking owner information is missing' });
    }
    
    const requesterId = String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    console.log(`Authorization check: ownerId=${ownerId}, requesterId=${requesterId}, isAdmin=${isAdmin}`);

    // Allow deletion if user is owner OR admin
    if (ownerId !== requesterId && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking' });
    }

    // If admin is deleting someone else's booking, create audit record
    if (isAdmin && ownerId !== requesterId) {
      try {
        await Audit.create({
          action: 'delete',
          performedBy: req.user.id,
          affectedUser: booking.bookedBy._id || booking.bookedBy,
          bookingSnapshot: booking.toClient ? booking.toClient() : booking.toJSON(),
          reason: 'Admin deletion',
          metadata: {
            bookingId: booking._id,
            roomDetails: {
              building: booking.building,
              floor: booking.floor,
              room: booking.room
            }
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
        console.log(`Admin ${req.user.name} deleted booking ${booking._id} owned by user ${booking.bookedBy._id}`);
      } catch (auditErr) {
        console.error('Failed to create audit record:', auditErr);
        // Continue with deletion even if audit fails
      }
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