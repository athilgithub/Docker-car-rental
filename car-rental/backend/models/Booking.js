const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  carId: String,
  carName: String,
  carPrice: Number,
  userId: String,
  userEmail: String,
  startDate: Date,
  endDate: Date,
  startTime: String,
  endTime: String,
  pickupLocation: String,
  dropoffLocation: String,
  driverOption: { type: String, enum: ['with-driver', 'self-drive'], default: 'with-driver' },
  drivingLicense: { type: String, required: false },
  licenseExpiry: { type: Date, required: false },
  licenseState: { type: String, required: false },
  bookingType: { type: String, enum: ['daily', 'hourly'], default: 'daily' },
  rentalDuration: {
    days: { type: Number, default: 0 },
    hours: { type: Number, default: 0 }
  },
  totalPrice: Number,
  status: { type: String, default: 'confirmed' },
  bookingDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['online', 'cash'], default: 'online' },
  paymentId: String,
  orderId: String,
  signature: String,
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: false }
});

module.exports = mongoose.model('Booking', BookingSchema);