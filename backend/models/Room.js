const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true },
  floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true }
});

module.exports = mongoose.model('Room', roomSchema);
