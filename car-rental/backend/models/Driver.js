const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  status: { type: String, enum: ['available', 'busy', 'inactive'], default: 'available' },
  location: { type: String },
  rating: { type: Number, default: 4.5 },
  vehicle: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);