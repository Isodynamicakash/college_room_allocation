const express = require('express');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Booking = require('../models/booking');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /floors/:id/rooms?date=YYYY-MM-DD
router.get('/:id/rooms', auth, async (req, res) => {
  const { date } = req.query;
  const floor = await Floor.findById(req.params.id).populate('rooms');
  if (!floor) return res.status(404).json({ message: 'Floor not found' });
  // Get bookings for this floor and date
  const bookings = await Booking.find({ floor: floor._id, date });
  // Map room status
  const rooms = floor.rooms.map(room => {
    const booking = bookings.find(b => b.room.toString() === room._id.toString());
    return {
      _id: room._id,
      number: room.number,
      status: booking ? 'booked' : 'available',
      booking: booking || null
    };
  });
  res.json(rooms);
});

module.exports = router;
