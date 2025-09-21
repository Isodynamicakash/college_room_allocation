const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  floors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Floor' }]
});

module.exports = mongoose.model('Building', buildingSchema);
