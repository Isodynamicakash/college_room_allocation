const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
});

module.exports = mongoose.model('Floor', floorSchema);
