const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// GET /api/rooms/:floorId/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
// Auth not required for viewing availability, but auth can be added if needed
router.get('/:floorId/availability', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    const floorId = req.params.floorId;

    if (!date || !startTime || !endTime) {
      console.warn('Missing query parameters:', { date, startTime, endTime });
      return res.status(400).json({ message: 'Date and time range are required.' });
    }

    // Basic type validation
    if (typeof date !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string') {
      return res.status(400).json({ message: 'Invalid query parameter types.' });
    }

    // Fetch floor and rooms
    const floor = await Floor.findById(floorId).populate('rooms');
    if (!floor) {
      console.warn('Floor not found:', floorId);
      return res.status(404).json({ message: 'Floor not found' });
    }

    // Find overlapping bookings and populate bookedBy (_id and name)
    const bookings = await Booking.find({
      floor: floorId,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    }).populate('bookedBy', '_id name');

    // Normalize bookings per room and return consistent shape
    const roomStatus = (floor.rooms || []).map((room) => {
      const roomBookings = bookings
        .filter((b) => b.room && b.room.toString() === room._id.toString())
        .map((b) => b.toClient ? b.toClient() : {
          _id: b._id,
          startTime: b.startTime,
          endTime: b.endTime,
          purpose: b.purpose || null,
          bookedBy: b.bookedBy
            ? { _id: b.bookedBy._id || b.bookedBy, name: b.bookedBy.name || null }
            : null,
          teacher: b.teacher,
          subject: b.subject,
          department: b.department,
          source: b.source,
          overrideAllowed: b.overrideAllowed
        });

      return {
        _id: room._id,
        number: room.number,
        status: roomBookings.length > 0 ? 'booked' : 'available',
        bookings: roomBookings
      };
    });

    return res.json(roomStatus);
  } catch (err) {
    console.error('Availability error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;