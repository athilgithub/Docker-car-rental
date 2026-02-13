const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function showDriverBookings() {
  await mongoose.connect('mongodb://192.168.37.130:27017/car_rental');
  const driverId = '691f088038d6cbbc14dafa7c';
  const bookings = await Booking.find({ driver: driverId });
  console.log('BOOKINGS FOR DRIVER:', bookings);
  mongoose.disconnect();
}

showDriverBookings();
