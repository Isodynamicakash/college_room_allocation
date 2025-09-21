const express = require('express');
const Building = require('../models/Building');
const Floor = require('../models/Floor');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /buildings
router.get('/', auth, async (req, res) => {
  const buildings = await Building.find().populate('floors');
  res.json(buildings);
});

// GET /buildings/:id/floors
router.get('/:id/floors', auth, async (req, res) => {
  const building = await Building.findById(req.params.id).populate('floors');
  if (!building) return res.status(404).json({ message: 'Building not found' });
  res.json(building.floors);
});

module.exports = router;
