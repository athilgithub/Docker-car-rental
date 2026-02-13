const mongoose = require('mongoose');
const Driver = require('./models/Driver');

async function showDrivers() {
  await mongoose.connect('mongodb://192.168.37.130:27017/car_rental');
  const drivers = await Driver.find({});
  console.log('DRIVERS:', drivers);
  mongoose.disconnect();
}

showDrivers();
