const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Template = require('../models/Template');
const Audit = require('../models/Audit');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const bulkCreateBookings = require('../helpers/bulkCreateBookings');

// GET /api/admin/bookings - Get all bookings for admin management
router.get('/bookings', auth, isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      date, 
      building, 
      floor, 
      room, 
      department, 
      source, 
      teacher 
    } = req.query;

    const filter = {};
    
    if (date) filter.date = date;
    if (building) filter.building = building;
    if (floor) filter.floor = floor;
    if (room) filter.room = room;
    if (department) filter.department = department;
    if (source) filter.source = source;
    if (teacher) filter.teacher = { $regex: teacher, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('bookedBy', '_id name')
      .populate('building', 'name')
      .populate('floor', 'number')
      .populate('room', 'number')
      .sort({ date: -1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    const formattedBookings = bookings.map(booking => booking.toClient ? booking.toClient() : booking);

    res.json({
      bookings: formattedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin bookings fetch error:', err);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// POST /api/admin/bookings/batch - Create bulk bookings
router.post('/bookings/batch', auth, isAdmin, async (req, res) => {
  try {
    const {
      building,
      floor,
      room, // can be null for "all rooms"
      dayOfWeek, // 1=Monday, 2=Tuesday, etc. (0=Sunday)
      startTime,
      endTime,
      department,
      subject,
      teacher,
      horizonDays = 60,
      forceOverride = false
    } = req.body;

    // Validation
    if (!building || !floor || !dayOfWeek || !startTime || !endTime || !department || !subject || !teacher) {
      return res.status(400).json({ 
        message: 'Building, floor, dayOfWeek, startTime, endTime, department, subject, and teacher are required' 
      });
    }

    if (horizonDays < 1 || horizonDays > 365) {
      return res.status(400).json({ message: 'horizonDays must be between 1 and 365' });
    }

    // Call bulk creation helper
    const result = await bulkCreateBookings({
      building,
      floor,
      room,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      department,
      subject,
      teacher,
      horizonDays: parseInt(horizonDays),
      forceOverride: Boolean(forceOverride),
      adminUser: req.user
    });

    // Create audit record for bulk operation
    try {
      await Audit.create({
        action: 'bulk_create',
        performedBy: req.user.id,
        reason: `Bulk booking creation for ${department} - ${subject}`,
        metadata: {
          batchParams: req.body,
          result: {
            created: result.created,
            skipped: result.skipped,
            conflicts: result.conflicts,
            deleted: result.deleted
          }
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    } catch (auditErr) {
      console.error('Failed to create audit record for bulk operation:', auditErr);
    }

    // Emit socket update for affected dates
    try {
      const io = req.app.get('io');
      if (io && result.affectedDates) {
        result.affectedDates.forEach(date => {
          io.emit('bookingUpdate', { date });
        });
      }
    } catch (emitErr) {
      console.warn('Failed to emit bookingUpdate events:', emitErr);
    }

    res.json({
      message: 'Bulk booking operation completed',
      result: {
        created: result.created,
        skipped: result.skipped,
        conflicts: result.conflicts,
        deleted: result.deleted,
        affectedDates: result.affectedDates
      }
    });
  } catch (err) {
    console.error('Bulk booking error:', err);
    res.status(500).json({ 
      message: err.message || 'Server error during bulk booking operation' 
    });
  }
});

// Optional: GET /api/admin/templates - Get booking templates
router.get('/templates', auth, isAdmin, async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true })
      .populate('building', 'name')
      .populate('floor', 'number')
      .populate('room', 'number')
      .populate('createdBy', 'name')
      .sort({ department: 1, subject: 1 });

    res.json({ templates });
  } catch (err) {
    console.error('Templates fetch error:', err);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
});

// Optional: POST /api/admin/templates - Create a new template
router.post('/templates', auth, isAdmin, async (req, res) => {
  try {
    const {
      name,
      building,
      floor,
      room,
      dayOfWeek,
      startTime,
      endTime,
      teacher,
      subject,
      department,
      overrideAllowed = false
    } = req.body;

    if (!name || !building || !floor || !room || !dayOfWeek || !startTime || !endTime || !teacher || !subject || !department) {
      return res.status(400).json({ message: 'All template fields are required' });
    }

    const template = await Template.create({
      name,
      building,
      floor,
      room,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      teacher,
      subject,
      department,
      overrideAllowed: Boolean(overrideAllowed),
      createdBy: req.user.id
    });

    const populated = await Template.findById(template._id)
      .populate('building', 'name')
      .populate('floor', 'number')
      .populate('room', 'number')
      .populate('createdBy', 'name');

    res.status(201).json({
      message: 'Template created successfully',
      template: populated
    });
  } catch (err) {
    console.error('Template creation error:', err);
    res.status(500).json({ message: 'Server error creating template' });
  }
});

module.exports = router;