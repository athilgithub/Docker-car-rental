require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');

// Import Booking and Notification models
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// User cancels their own booking
app.post('/api/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    // Only allow cancellation if status is confirmed or pending
    if (!['confirmed', 'pending'].includes(booking.status)) {
      return res.status(403).json({ error: 'Cannot cancel this booking.' });
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (err) {
    console.error('User cancel booking error:', err);
    res.status(500).json({ error: 'Error cancelling booking.' });
  }
});

// Driver cancels assigned ride
app.post('/api/driver/cancel-ride', async (req, res) => {
  try {
    const { bookingId, driverId, reason } = req.body;
    if (!bookingId || !driverId) {
      return res.status(400).json({ error: 'bookingId and driverId are required.' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    // Only allow cancellation if driver is assigned and status is confirmed/pending
    if (booking.driverId !== driverId || !['confirmed', 'pending'].includes(booking.status)) {
      return res.status(403).json({ error: 'Not allowed to cancel this booking.' });
    }
    booking.status = 'driver_cancelled';
    booking.cancellationReason = reason || '';
    await booking.save();
    // TODO: Notify client and admin (email or notification)
    res.json({ success: true, message: 'Booking cancelled by driver.' });
  } catch (err) {
    console.error('Driver cancel ride error:', err);
    res.status(500).json({ error: 'Error cancelling ride.' });
  }
});
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Initialize Razorpay with your API keys - REPLACE WITH YOUR ACTUAL KEYS
const razorpay = new Razorpay({
  key_id: 'rzp_test_Ri3dUwgsmbbH8K', // new test key from user
  key_secret: 'yM6LkHzUGHs6NXeZ54ZxOP8U' // new test secret from user
});

// Log Razorpay configuration (without exposing secret)
console.log('🔑 Razorpay Key ID:', razorpay.key_id ? razorpay.key_id.substring(0, 12) + '...' : 'Not configured');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
// Reset password endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    // Find user by email
    const user = await SignupUser.findOne({ email });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    // Check token and expiry
    if (user.resetToken !== resetToken || Date.now() > user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // Also update validCredentials in memory if user exists there
    if (validCredentials[email]) {
      validCredentials[email].password = newPassword;
    }

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
});
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Check car availability by date range
app.post('/api/check-availability', async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ error: 'carId, startDate, and endDate are required.' });
    }
    // Find overlapping bookings for this car
    const overlapping = await Booking.find({
      carId,
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ],
      status: { $in: ['confirmed', 'pending'] }
    });
    if (overlapping.length > 0) {
      return res.json({ available: false });
    } else {
      return res.json({ available: true });
    }
  } catch (err) {
    console.error('Check availability error:', err);
    res.status(500).json({ error: 'Error checking availability.' });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only 1 file at a time
    fieldSize: 10 * 1024 * 1024, // 10MB field value limit
    fieldNameSize: 100, // Max field name size
    fields: 50 // Max number of fields - increased to handle all car form fields
  },
  fileFilter: function (req, file, cb) {
    // Check file type - only allow common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
    }
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/car_rental');

// User schema for normal signup users
const signupUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  resetToken: String,
  resetTokenExpiry: Date
});
const SignupUser = mongoose.model('SignupUser', signupUserSchema);

// User schema for Google users
const googleUserSchema = new mongoose.Schema({
  sub: String,
  name: String,
  email: { type: String, unique: true },
  picture: String,
});
const GoogleUser = mongoose.model('GoogleUser', googleUserSchema);


// Contact schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// Car schema for car management
const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true }, // Daily rate
  hourlyRate: { type: Number }, // Hourly rate (optional, will be calculated if not provided)
  category: { type: String, required: true }, // SUV, Sedan, Hatchback, etc.
  fuel: { type: String, required: true }, // Petrol, Diesel, Electric, Hybrid
  transmission: { type: String, required: true }, // Manual, Automatic
  seats: { type: Number, required: true },
  doors: { type: Number, required: true },
  image: { type: String, required: true }, // Image URL/path
  features: [String], // Array of features like AC, GPS, etc.
  description: String,
  available: { type: Boolean, default: true }, // Available or not
  inventory: { type: Number, default: 1 }, // Number of units available (for fleet management)
  location: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Car = mongoose.model('Car', carSchema);

// Normal signup endpoint with validation
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Backend email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    // Check if email already exists in predefined credentials
    if (validCredentials[email]) {
      return res.status(409).json({ error: 'Email already registered. Please use login.' });
    }
    // For new signups, determine role and add to valid credentials
    const userRole = getUserRole(email);
    validCredentials[email] = {
      password: password,
      name: name,
      role: userRole
    };
    console.log('New user registered:', email, 'Role:', userRole);
    res.json({ success: true, message: 'Signup successful.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed.' });
  }
});

// Function to determine user role based on email
function getUserRole(email) {
  if (email.startsWith('admin@')) {
    return 'admin';
  } else if (email.startsWith('driver@')) {
    return 'driver';
  } else if (email.startsWith('client@')) {
    return 'client';
  } else {
    return 'user'; // Default role for regular users (NOT 'client')
  }
}

// Predefined valid credentials for each role
const validCredentials = {
  'admin@test.com': { password: 'admin123', name: 'Admin User', role: 'admin' },
  'driver@test.com': { password: 'driver123', name: 'Driver User', role: 'driver' },
  'client@test.com': { password: 'client123', name: 'Client User', role: 'client' },
  // Additional admin accounts
  'admin@company.com': { password: 'admin456', name: 'Company Admin', role: 'admin' },
  // Additional driver accounts
  'driver@company.com': { password: 'driver456', name: 'Company Driver', role: 'driver' },
  // Additional client accounts
  'client@company.com': { password: 'client456', name: 'Company Client', role: 'client' }
};

// Normal login endpoint with proper authentication
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    // Backend email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    // Check if credentials are valid in memory
    let validUser = validCredentials[email];
    if (validUser && validUser.password === password) {
      // Valid credentials - log successful login
      console.log('Successful login:', email, 'Role:', validUser.role);
      return res.json({
        success: true,
        message: 'Login successful.',
        user: {
          name: validUser.name,
          email: email,
          role: validUser.role
        }
      });
    }
    // If not found in memory, check MongoDB
    const signupUser = await SignupUser.findOne({ email });
    if (signupUser && signupUser.password === password) {
      // Default role for signup users
      const userRole = getUserRole(email);
      console.log('Successful login (MongoDB):', email, 'Role:', userRole);
      return res.json({
        success: true,
        message: 'Login successful.',
        user: {
          name: signupUser.name || email,
          email: email,
          role: userRole
        }
      });
    }
    // Invalid credentials
    console.log('Invalid login attempt:', email);
    return res.status(401).json({ error: 'Invalid email or password.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Forgot password endpoint
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    // Check if user exists in either database
    const signupUser = await SignupUser.findOne({ email });
    if (!signupUser) {
      // For security reasons, don't reveal if the email exists or not
      return res.json({ 
        success: true, 
        message: 'If this email exists in our system, you will receive password reset instructions.' 
      });
    }
    // Generate a reset token (6-digit code)
    const resetToken = crypto.randomInt(100000, 999999).toString();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    // Store the reset token and send email
    signupUser.resetToken = resetToken;
    signupUser.resetTokenExpiry = resetTokenExpiry;
    await signupUser.save();
    // Send password reset email using nodemailer
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Car Rental Password Reset',
      text: `Your password reset code is: ${resetToken}\n\nEnter this code in the app to reset your password.\n\nThis code will expire in 1 hour. If you did not request a password reset, please ignore this email.`
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to', email);
    } catch (mailErr) {
      console.error('Error sending password reset email:', mailErr);
    }
    res.json({ 
      success: true, 
      message: 'Password reset instructions have been sent to your email!'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
});

// Google authentication endpoint (handles both login and signup)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { sub, name, email, picture, user } = req.body;
    
    // Handle both formats from frontend
    const googleUserData = {
      sub: sub || (user && user.sub),
      name: name || (user && user.name),
      email: email || (user && user.email),
      picture: picture || (user && user.picture)
    };

    if (!googleUserData.sub || !googleUserData.email) {
      return res.status(400).json({ error: 'Missing required Google user data.' });
    }

    // Check if user already exists
    let existingUser = await GoogleUser.findOne({ 
      $or: [
        { sub: googleUserData.sub },
        { email: googleUserData.email }
      ]
    });

    if (existingUser) {
      // Update existing user info if needed
      existingUser.name = googleUserData.name || existingUser.name;
      existingUser.picture = googleUserData.picture || existingUser.picture;
      await existingUser.save();
      
      const userRole = getUserRole(existingUser.email);
      
      res.json({ 
        success: true, 
        message: 'Google login successful.',
        user: { 
          name: existingUser.name, 
          email: existingUser.email,
          picture: existingUser.picture,
          role: userRole
        } 
      });
    } else {
      // Create new Google user
      const newGoogleUser = new GoogleUser({
        sub: googleUserData.sub,
        name: googleUserData.name,
        email: googleUserData.email,
        picture: googleUserData.picture
      });
      
      await newGoogleUser.save();
      
      const userRole = getUserRole(newGoogleUser.email);
      
      res.json({ 
        success: true, 
        message: 'Google signup successful.',
        user: { 
          name: newGoogleUser.name, 
          email: newGoogleUser.email,
          picture: newGoogleUser.picture,
          role: userRole
        } 
      });
    }
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed.' });
  }
});

// Check car availability endpoint
app.post('/api/check-availability', async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    
    console.log('🔍 Checking availability for:', { carId, startDate, endDate });

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'carId, startDate, and endDate are required' 
      });
    }

    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    // Find all confirmed bookings for this car that overlap with requested dates
    const conflictingBookings = await Booking.find({
      carId: carId,
      status: { $in: ['confirmed', 'active'] },
      paymentStatus: 'success',
      $or: [
        // Booking starts during requested period
        { startDate: { $gte: requestedStart, $lt: requestedEnd } },
        // Booking ends during requested period
        { endDate: { $gt: requestedStart, $lte: requestedEnd } },
        // Booking completely contains requested period
        { 
          startDate: { $lte: requestedStart },
          endDate: { $gte: requestedEnd }
        }
      ]
    }).select('startDate endDate userId userEmail');

    // Get car details to check total units available
    // Try to find by MongoDB _id first, if not found try by numeric id
    let car = await Car.findOne({ _id: carId }).catch(() => null);
    if (!car) {
      car = await Car.findOne({ id: carId }).catch(() => null);
    }
    
    const totalUnits = car ? (car.inventory || 1) : 1; // Default to 1 if not specified
    
    // Calculate available units (total - booked)
    const bookedUnits = conflictingBookings.length;
    const availableUnits = totalUnits - bookedUnits;
    const isAvailable = availableUnits > 0;

    console.log(`📊 Availability check result:`, {
      carId,
      carFound: !!car,
      totalUnits,
      bookedUnits,
      availableUnits,
      isAvailable,
      conflicts: conflictingBookings.length
    });

    res.json({
      isAvailable,
      availableUnits,
      totalUnits,
      conflictingBookings: conflictingBookings.map(booking => ({
        startDate: booking.startDate,
        endDate: booking.endDate
      })),
      message: isAvailable 
        ? `${availableUnits} unit(s) available for your selected dates`
        : 'This car is not available for your selected dates'
    });

  } catch (error) {
    console.error('❌ Error checking availability:', error);
    res.status(500).json({ 
      error: 'Failed to check availability',
      message: error.message 
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }
  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.json({ success: true, message: 'Message received! We will contact you soon.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save message.' });
  }
});

// Get all contact messages (for admin dashboard)
app.get('/api/contact', async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Failed to fetch contact messages:', err);
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
});

// Get admin statistics (for dashboard)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await SignupUser.countDocuments() + await GoogleUser.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalCars = await Car.countDocuments();
    const totalMessages = await Contact.countDocuments();
    
    // Calculate total revenue from bookings
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      totalUsers,
      totalBookings,
      totalCars,
      totalMessages,
      totalRevenue
    });
  } catch (err) {
    console.error('Failed to fetch admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin statistics.' });
  }
});

// Get user statistics (for client dashboard)
app.get('/api/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's booking statistics
    const totalBookings = await Booking.countDocuments({ userId: userId });
    const activeBookings = await Booking.countDocuments({ 
      userId: userId, 
      status: { $in: ['confirmed', 'ongoing'] },
      endDate: { $gte: new Date() }
    });
    const completedBookings = await Booking.countDocuments({ 
      userId: userId, 
      status: 'completed'
    });
    
    // Calculate total spent
    const spentResult = await Booking.aggregate([
      { $match: { userId: userId, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0;

    // Get recent booking for next trip info
    const nextBooking = await Booking.findOne({ 
      userId: userId, 
      startDate: { $gte: new Date() },
      status: { $in: ['confirmed', 'ongoing'] }
    }).sort({ startDate: 1 });

    res.json({
      totalBookings,
      activeBookings,
      completedBookings,
      totalSpent,
      nextBooking
    });
  } catch (err) {
    console.error('Failed to fetch user stats:', err);
    res.status(500).json({ error: 'Failed to fetch user statistics.' });
  }
});

// Get all cars (for cars page)
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find({ available: true }).sort({ name: 1 });
    res.json(cars);
  } catch (err) {
    console.error('Failed to fetch cars:', err);
    res.status(500).json({ error: 'Failed to fetch cars.' });
  }
});

// Get a specific car by ID
app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found.' });
    }
    res.json(car);
  } catch (err) {
    console.error('Failed to fetch car:', err);
    res.status(500).json({ error: 'Failed to fetch car.' });
  }
});

// Add a new car (for admin)
app.post('/api/cars', upload.single('image'), async (req, res) => {
  try {
    const {
      name, brand, model, year, price, category,
      fuel, transmission, seats, doors, features,
      description, location, imageUrl
    } = req.body;

    // Validation
    if (!name || !brand || !model || !year || !price || !category || !fuel || !transmission || !seats || !doors) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    // Handle image - priority: uploaded file > provided URL > placeholder
    let imagePath = '/placeholder-car.svg';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    } else if (imageUrl && imageUrl.trim()) {
      imagePath = imageUrl;
    }

    // Parse features if it's a string
    let parsedFeatures = [];
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }

    const car = new Car({
      name,
      brand,
      model,
      year: parseInt(year),
      price: parseFloat(price),
      category,
      fuel,
      transmission,
      seats: parseInt(seats),
      doors: parseInt(doors),
      image: imagePath,
      features: parsedFeatures,
      description,
      location,
      available: true
    });

    await car.save();
    console.log('✅ Car added successfully:', car.name);
    res.status(201).json({ success: true, message: 'Car added successfully', car });
  } catch (err) {
    console.error('❌ Error adding car:', err);
    res.status(500).json({ error: 'Failed to add car.', details: err.message });
  }
});

// Update car availability
app.patch('/api/cars/:id/availability', async (req, res) => {
  try {
    const { available } = req.body;
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { available, updatedAt: new Date() },
      { new: true }
    );
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found.' });
    }
    
    res.json({ success: true, message: 'Car availability updated', car });
  } catch (err) {
    console.error('Failed to update car availability:', err);
    res.status(500).json({ error: 'Failed to update car availability.' });
  }
});

// Delete a car (for admin)
app.delete('/api/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    
    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'Car not found.' });
    }
    
    // Check if car has any active bookings
    const activeBookings = await Booking.countDocuments({
      carId: carId,
      status: { $in: ['confirmed', 'ongoing'] },
      endDate: { $gte: new Date() }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete car with active bookings. Please complete or cancel existing bookings first.' 
      });
    }
    
    // Delete the car
    await Car.findByIdAndDelete(carId);
    
    console.log('✅ Car deleted successfully:', car.name);
    res.json({ 
      success: true, 
      message: 'Car deleted successfully',
      deletedCar: { id: carId, name: car.name }
    });
  } catch (err) {
    console.error('❌ Error deleting car:', err);
    res.status(500).json({ 
      error: 'Failed to delete car.', 
      details: err.message 
    });
  }
});

// Update a car (for admin)
app.put('/api/cars/:id', upload.single('image'), async (req, res) => {
  try {
    const carId = req.params.id;
    const {
      name, brand, model, year, price, category,
      fuel, transmission, seats, doors, features,
      description, location, imageUrl, available
    } = req.body;

    // Check if car exists
    const existingCar = await Car.findById(carId);
    if (!existingCar) {
      return res.status(404).json({ error: 'Car not found.' });
    }

    // Handle image update - priority: uploaded file > provided URL > keep existing
    let imagePath = existingCar.image;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    } else if (imageUrl && imageUrl.trim()) {
      imagePath = imageUrl;
    }

    // Parse features if it's a string
    let parsedFeatures = existingCar.features;
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }

    // Update car data
    const updatedCar = await Car.findByIdAndUpdate(
      carId,
      {
        name: name || existingCar.name,
        brand: brand || existingCar.brand,
        model: model || existingCar.model,
        year: year ? parseInt(year) : existingCar.year,
        price: price ? parseFloat(price) : existingCar.price,
        category: category || existingCar.category,
        fuel: fuel || existingCar.fuel,
        transmission: transmission || existingCar.transmission,
        seats: seats ? parseInt(seats) : existingCar.seats,
        doors: doors ? parseInt(doors) : existingCar.doors,
        image: imagePath,
        features: parsedFeatures,
        description: description || existingCar.description,
        location: location || existingCar.location,
        available: available !== undefined ? available : existingCar.available,
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log('✅ Car updated successfully:', updatedCar.name);
    res.json({ 
      success: true, 
      message: 'Car updated successfully', 
      car: updatedCar 
    });
  } catch (err) {
    console.error('❌ Error updating car:', err);
    res.status(500).json({ 
      error: 'Failed to update car.', 
      details: err.message 
    });
  }
});

// Get all users (for admin dashboard)
app.get('/api/users', async (req, res) => {
  try {
    const normalUsers = await SignupUser.find({}, '-password');
    const googleUsers = await GoogleUser.find({});
    const allUsers = [
      ...normalUsers.map(u => ({ ...u._doc, role: 'Client', status: 'Active' })),
      ...googleUsers.map(u => ({ ...u._doc, role: 'Google', status: 'Active' }))
    ];
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Get all bookings (for admin dashboard)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({});
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// Get user-specific bookings
app.get('/api/user/:userId/bookings', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('❌ Error fetching user bookings:', err);
    res.status(500).json({ error: 'Failed to fetch user bookings.' });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    // Destructure all booking fields from req.body at the top
    const {
      carId,
      carName,
      carPrice,
      userId,
      userEmail,
      startDate,
      endDate,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      driverOption,
      drivingLicense,
      licenseExpiry,
      licenseState,
      bookingType,
      rentalDuration,
      totalPrice,
      status,
      bookingDate,
      paymentMethod,
      paymentId,
      orderId,
      signature
    } = req.body;
    // Prevent double booking: check for overlapping bookings
    const overlapping = await Booking.find({
      carId,
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ],
      status: { $in: ['confirmed', 'pending'] }
    });
    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'This car is already booked for the selected dates.' });
    }

    console.log('📋 Creating booking with data:', {
      ...req.body,
      paymentId: req.body.paymentId ? '***' : undefined,
      signature: req.body.signature ? '***' : undefined
    });

    let assignedDriver = null;
    console.log('DEBUG: driverOption:', driverOption, 'paymentMethod:', paymentMethod);
    if (driverOption === 'with-driver') {
      const Driver = require('./models/Driver');
      // Always assign Mike Johnson as the driver
      assignedDriver = await Driver.findOne({ email: 'mike.johnson@example.com' });
      if (!assignedDriver) {
        // Create Mike Johnson if not found
        assignedDriver = await Driver.create({
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '+91 6381014350',
          status: 'available', // must match Driver schema enum
          licenseNumber: 'DL1420110012345',
        });
      }
    }

    // Determine payment status for booking
    let bookingPaymentStatus = req.body.paymentStatus || 'pending';
    if (paymentMethod === 'cash') {
      bookingPaymentStatus = 'success';
    }

    // Create booking using new schema
    const bookingData = {
      carId,
      carName,
      carPrice,
      userId,
      userEmail,
      startDate,
      endDate,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation: dropoffLocation || pickupLocation,
      driverOption,
      drivingLicense,
      licenseExpiry,
      licenseState,
      bookingType,
      rentalDuration,
      totalPrice,
      status: assignedDriver ? 'accepted' : 'pending', // Show in driver dashboard immediately
      bookingDate: bookingDate || new Date(),
      paymentMethod,
      paymentId,
      orderId,
      signature,
      paymentStatus: bookingPaymentStatus,
      createdAt: new Date(),
      driver: assignedDriver ? assignedDriver._id : null // Assign driver
    };
    // Validate start/end date before saving booking
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const booking = new Booking(bookingData);
    await booking.save();
    console.log('✅ Booking created successfully:', booking._id);

    // Create notification for assigned driver
    if (assignedDriver) {
      const Notification = require('./models/Notification');
      const notification = new Notification({
        driver: assignedDriver._id,
        booking: booking._id,
        message: `New ride request: ${pickupLocation} to ${dropoffLocation} for ${startDate}`,
        status: 'unread',
        action: 'pending'
      });
      await notification.save();
      console.log('🚗 Notification created for driver:', assignedDriver._id);
      console.log('DEBUG: Assigned driver ObjectId for dashboard:', assignedDriver._id.toString());
      // Do NOT mark driver as busy, so all rides go to this driver
    }

    // Validate self-drive requirements
    if (driverOption === 'self-drive') {
      if (!drivingLicense || !licenseExpiry || !licenseState) {
        return res.status(400).json({ 
          error: 'Driving license details are required for self-drive bookings' 
        });
      }

      const licenseExpiryDate = new Date(licenseExpiry);
      if (licenseExpiryDate <= new Date()) {
        return res.status(400).json({ 
          error: 'Driving license must be valid (not expired)' 
        });
      }
    }

    // Verify payment if payment details are provided
    let paymentStatus = 'pending';
    if (paymentId && orderId && signature) {
      try {
        console.log(' Verifying payment signature...');
        
        // Verify payment signature using crypto
        const generated_signature = crypto
          .createHmac('sha256', razorpay.key_secret)
          .update(orderId + '|' + paymentId)
          .digest('hex');

        if (generated_signature === signature) {
          paymentStatus = 'success';
          console.log('✅ Payment signature verified successfully');
        } else {
          console.error('❌ Payment signature verification failed');
          return res.status(400).json({ 
            error: 'Invalid payment signature. Payment verification failed.' 
          });
        }
      } catch (verifyError) {
        console.error('❌ Payment verification error:', verifyError);
        return res.status(400).json({ 
          error: 'Payment verification failed',
          details: verifyError.message
        });
      }
    }

    // ...booking creation and notification logic moved above...

    res.status(201).json({ 
      success: true,
      message: 'Booking created successfully', 
      booking: {
        id: booking._id,
        carName: booking.carName,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId
      }
    });
  } catch (err) {
    console.error('❌ Booking creation error:', err);
    if (err.name === 'ValidationError') {
      // Log all validation errors for debugging
      for (const field in err.errors) {
        console.error(`Field '${field}' error:`, err.errors[field].message);
      }
      res.status(400).json({
        error: 'Booking validation failed',
        details: err.message,
        fields: Object.keys(err.errors).map(f => ({ field: f, message: err.errors[f].message }))
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create booking',
        details: err.message 
      });
    }
  }
});

// Create Razorpay Order - FIXED VERSION
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    console.log('📝 Creating Razorpay order request:', req.body);
    
    const { amount, currency = 'INR', receipt } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || amount < 100) {
      console.error('❌ Invalid amount:', amount);
      return res.status(400).json({ 
        error: 'Amount must be at least 100 paise (1 rupee)',
        received: amount
      });
    }

    // Check if Razorpay is properly configured
    if (!razorpay.key_id || razorpay.key_id.includes('your_key_id_here')) {
      console.error('❌ Razorpay not properly configured');
      return res.status(500).json({ 
        error: 'Payment gateway not configured. Please contact support.',
        details: 'Razorpay credentials not set'
      });
    }

    const options = {
      amount: Math.round(Number(amount)), // Ensure it's a number and rounded
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture after payment
    };

    console.log('💳 Creating Razorpay order with options:', {
      ...options,
      key_id: razorpay.key_id.substring(0, 12) + '...'
    });
    
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created successfully:', order.id);
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    
    // Provide more specific error messages
    if (error.statusCode === 400) {
      return res.status(400).json({ 
        error: 'Invalid request to payment gateway',
        details: error.error?.description || error.message,
        code: error.error?.code
      });
    }
    
    if (error.statusCode === 401) {
      return res.status(500).json({ 
        error: 'Payment gateway authentication failed',
        details: 'Please check Razorpay credentials'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error.message || 'Unknown error occurred',
      statusCode: error.statusCode
    });
  }
});

// Verify Razorpay Payment
app.post('/api/verify-razorpay-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment verification parameters' 
      });
    }

    // Create signature for verification
    const generated_signature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment is verified
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      });
    } else {
      // Invalid signature
      res.status(400).json({ 
        error: 'Invalid payment signature',
        success: false 
      });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      details: error.message 
    });
  }
});

// Get payment details for a booking
app.get('/api/bookings/:id/payment', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If payment ID exists, fetch payment details from Razorpay
    if (booking.paymentId) {
      try {
        const payment = await razorpay.payments.fetch(booking.paymentId);
        
        res.json({
          booking_id: booking._id,
          payment_id: booking.paymentId,
          order_id: booking.orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: payment.created_at,
          captured_at: payment.captured_at
        });
      } catch (razorpayError) {
        console.error('Error fetching payment from Razorpay:', razorpayError);
        res.json({
          booking_id: booking._id,
          payment_id: booking.paymentId,
          order_id: booking.orderId,
          status: booking.paymentStatus,
          error: 'Could not fetch payment details from gateway'
        });
      }
    } else {
      res.json({
        booking_id: booking._id,
        status: 'no_payment',
        message: 'No payment associated with this booking'
      });
    }
  } catch (err) {
    console.error('Error fetching payment details:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Get all payments (for admin)
app.get('/api/admin/payments', async (req, res) => {
  try {
    const bookingsWithPayments = await Booking.find({ 
      paymentId: { $exists: true, $ne: null } 
    }).sort({ bookingDate: -1 });

    const paymentSummary = bookingsWithPayments.map(booking => ({
      booking_id: booking._id,
      car_name: booking.carName,
      user_email: booking.userEmail,
      amount: booking.totalPrice,
      payment_id: booking.paymentId,
      order_id: booking.orderId,
      payment_status: booking.paymentStatus,
      booking_date: booking.bookingDate,
      start_date: booking.startDate,
      end_date: booking.endDate
    }));

    const totalRevenue = bookingsWithPayments.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0);

    res.json({
      payments: paymentSummary,
      total_payments: bookingsWithPayments.length,
      total_revenue: totalRevenue,
      currency: 'INR'
    });
  } catch (err) {
    console.error('Error fetching admin payments:', err);
    res.status(500).json({ error: 'Failed to fetch payment data' });
  }
});

// Driver-specific endpoints
// Get ride details for driver (accepted/pending)
app.get('/api/driver/:driverId/rides/details', async (req, res) => {
  try {
    const { driverId } = req.params;
    // Find bookings assigned to driver with status accepted or pending
    const rides = await Booking.find({ driver: driverId, status: { $in: ['accepted', 'pending', 'pending'] } });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride details.' });
  }
});
// Driver accepts/rejects booking notification
app.post('/api/driver/:driverId/notification/:notificationId/action', async (req, res) => {
  try {
    const { driverId, notificationId } = req.params;
    const { action } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }
    const notification = await Notification.findOne({ _id: notificationId, driver: driverId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    notification.action = action;
    notification.status = 'read';
    await notification.save();
    // Update booking status
    const booking = await Booking.findById(notification.booking);
    if (booking) {
      booking.status = action === 'accepted' ? 'accepted' : 'rejected';
      await booking.save();

      // Notify user (create notification)
      const Notification = require('./models/Notification');
      const userNotification = new Notification({
        user: booking.userId,
        booking: booking._id,
        message: action === 'accepted'
          ? `Driver has accepted your ride from ${booking.pickupLocation} to ${booking.dropoffLocation}.`
          : `Driver has rejected your ride from ${booking.pickupLocation} to ${booking.dropoffLocation}.`,
        status: 'unread',
        action: action
      });
      await userNotification.save();
    }

    // Alert message for driver (simulate real-time)
    const alertMessage = action === 'accepted'
      ? 'You have accepted the ride. User will be notified.'
      : 'You have rejected the ride. User will be notified.';

    res.json({ success: true, message: `Booking ${action} by driver.`, alert: alertMessage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification/booking.' });
  }
});
// Get notifications for driver
app.get('/api/driver/:driverId/notifications', async (req, res) => {
  try {
    const { driverId } = req.params;
    const notifications = await Notification.find({ driver: driverId }).populate('booking');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});
// Get driver profile and stats
app.get('/api/driver/profile/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // For now, return mock driver data
    // In a real app, you'd have a Driver model
    const driverProfile = {
      id: driverId,
      name: 'Mike Johnson',
      email: 'mike.johnson@carrentals.com',
      phone: '+91 98765 43210',
      licenseNumber: 'DL1420110012345',
      experience: '5 years',
      rating: 4.8,
      totalRides: 0,
      totalEarnings: 0
    };
    
    // Get actual rides count for this driver
    const driverBookings = await Booking.find({ 
      status: 'confirmed',
      // In a real app, you'd filter by driverId
    });
    
    driverProfile.totalRides = driverBookings.length;
    driverProfile.totalEarnings = driverBookings.reduce((sum, booking) => 
      sum + (booking.totalPrice || booking.carPrice || 0), 0);
    
    res.json(driverProfile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver profile' });
  }
});

// Get driver's assigned rides
app.get('/api/driver/rides/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Only show rides assigned to this driver
    const rides = await Booking.find({ driver: driverId }).sort({ bookingDate: -1 });

    // Transform booking data to match driver dashboard format
    const formattedRides = rides.map(booking => ({
      id: booking._id,
      date: booking.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: booking.startDate ? new Date(booking.startDate).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '10:00',
      pickup: booking.pickupLocation || 'Pickup Location',
      dropoff: booking.dropoffLocation || booking.pickupLocation || 'Drop-off Location',
      customerName: booking.userEmail ? booking.userEmail.split('@')[0] : 'Customer',
      customerPhone: '+91 98765 43210', // Mock phone number
      carName: booking.carName || 'Car',
      status: booking.status === 'confirmed' ? 'completed' : booking.status,
      fare: booking.totalPrice || booking.carPrice || 1000,
      distance: '25 km', // Mock distance
      duration: '45 min' // Mock duration
    }));

    res.json(formattedRides);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver rides' });
  }
});

// Get driver's assigned cars
app.get('/api/driver/cars/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Get some cars from the database (in a real app, filter by assigned driver)
    const cars = await Car.find({}).limit(3);
    
    // Transform to driver dashboard format
    const assignedCars = cars.map(car => ({
      id: car._id,
      name: car.name,
      model: car.year || '2023',
      plateNumber: `DL ${Math.floor(Math.random() * 100).toString().padStart(2, '0')} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(Math.random() * 9000) + 1000}`,
      fuelLevel: Math.floor(Math.random() * 40) + 60, // Random fuel level between 60-100%
      condition: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
      lastService: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 30 days
      image: car.image || '/placeholder-car.svg'
    }));
    
    res.json(assignedCars);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assigned cars' });
  }
});

// Get driver earnings
app.get('/api/driver/earnings/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Get bookings for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentBookings = await Booking.find({
      bookingDate: { $gte: sevenDaysAgo },
      status: 'confirmed'
    });
    
    // Group earnings by date
    const earningsByDate = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      earningsByDate[dateStr] = 0;
    }
    
    recentBookings.forEach(booking => {
      const bookingDate = new Date(booking.bookingDate).toISOString().split('T')[0];
      if (earningsByDate.hasOwnProperty(bookingDate)) {
        earningsByDate[bookingDate] += booking.totalPrice || booking.carPrice || 0;
      }
    });
    
    const earnings = Object.entries(earningsByDate).map(([date, amount]) => ({
      date,
      amount
    }));
    
    res.json(earnings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver earnings' });
  }
});

// Get driver reviews
app.get('/api/driver/reviews/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Get recent completed bookings (mock reviews for now)
    const completedBookings = await Booking.find({ status: 'confirmed' }).limit(10);
    
    const reviews = completedBookings.map((booking, index) => ({
      id: booking._id,
      customerName: booking.userEmail ? booking.userEmail.split('@')[0] : `Customer ${index + 1}`,
      rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
      comment: [
        'Excellent driving skills! Very punctual and professional.',
        'Good service, car was clean and comfortable.',
        'Safe driving and reached on time. Highly recommended!',
        'Very courteous driver, smooth ride experience.',
        'Professional service, would book again!'
      ][index % 5],
      date: new Date(booking.bookingDate).toISOString().split('T')[0],
      ride: `${booking.pickupLocation || 'Pickup'} to ${booking.dropoffLocation || booking.pickupLocation || 'Dropoff'}`
    }));
    
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver reviews' });
  }
});

// Health check endpoint for admin dashboard
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint to check Razorpay configuration
app.get('/api/test-razorpay', (req, res) => {
  try {
    const isConfigured = razorpay.key_id && 
                        razorpay.key_secret && 
                        !razorpay.key_id.includes('your_key_id_here') &&
                        !razorpay.key_secret.includes('your_razorpay_secret_here');
    
    res.json({
      configured: isConfigured,
      key_id: razorpay.key_id ? razorpay.key_id.substring(0, 12) + '...' : 'Not set',
      key_secret: razorpay.key_secret ? '***set***' : 'Not set',
      message: isConfigured ? 'Razorpay is properly configured' : 'Razorpay needs configuration'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check Razorpay configuration',
      details: error.message
    });
  }
});

// Seed cars endpoint to populate database with sample data
app.post('/api/seed-cars', async (req, res) => {
  try {
    // Check if cars already exist
    const existingCars = await Car.countDocuments();
    if (existingCars > 0) {
      return res.json({ message: `Database already has ${existingCars} cars. Use GET /api/cars to view them.` });
    }

    const sampleCars = [
      {
        name: 'Maruti Suzuki Dzire',
        brand: 'Maruti Suzuki',
        model: 'Dzire',
        year: 2023,
        price: 3750,
        category: 'Sedan',
        fuel: 'Hybrid',
        transmission: 'Automatic',
        seats: 5,
        doors: 4,
        image: 'swift.jpeg',
        features: ['AC', 'GPS', 'Bluetooth', 'USB'],
        description: 'Comfortable sedan with excellent fuel efficiency',
        available: true
      },
      {
        name: 'Mahindra XUV700',
        brand: 'Mahindra',
        model: 'XUV700',
        year: 2023,
        price: 7400,
        category: 'SUV',
        fuel: 'Petrol',
        transmission: 'Automatic',
        seats: 7,
        doors: 5,
        image: 'xuv.avif',
        features: ['AC', 'GPS', 'Leather Seats', 'Sunroof'],
        description: 'Spacious family SUV with premium features',
        available: true
      },
      {
        name: 'Tata Nexon EV',
        brand: 'Tata',
        model: 'Nexon EV',
        year: 2023,
        price: 6200,
        category: 'Electric',
        fuel: 'Electric',
        transmission: 'Automatic',
        seats: 5,
        doors: 4,
        image: 'tata.jpg',
        features: ['Autopilot', 'Premium Audio', 'Supercharging'],
        description: 'Modern electric vehicle with advanced technology',
        available: true
      },
      {
        name: 'Hyundai Verna',
        brand: 'Hyundai',
        model: 'Verna',
        year: 2022,
        price: 2900,
        category: 'Sedan',
        fuel: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        doors: 4,
        image: 'verna.webp',
        features: ['AC', 'GPS', 'Bluetooth'],
        description: 'Reliable and affordable sedan',
        available: true
      },
      {
        name: 'Toyota Innova Crysta',
        brand: 'Toyota',
        model: 'Innova Crysta',
        year: 2023,
        price: 3750,
        category: 'SUV',
        fuel: 'Hybrid',
        transmission: 'Automatic',
        seats: 7,
        doors: 5,
        image: 'crys.jpg',
        features: ['Premium Audio', 'Leather Seats', 'Panoramic Roof'],
        description: 'Premium family vehicle with luxury features',
        available: true
      },
      {
        name: 'Mahindra BE 6E',
        brand: 'Mahindra',
        model: 'BE 6E',
        year: 2023,
        price: 3200,
        category: 'Electric',
        fuel: 'Electric',
        transmission: 'Automatic',
        seats: 5,
        doors: 5,
        image: 'be.jpg',
        features: ['Fast Charging', 'Eco Mode', 'Smart Key'],
        description: 'Electric vehicle with fast charging capability',
        available: true
      },
      {
        name: 'Mahindra Thar',
        brand: 'Mahindra',
        model: 'Thar',
        year: 2022,
        price: 3200,
        category: 'SUV',
        fuel: 'Petrol',
        transmission: 'Manual',
        seats: 4,
        doors: 3,
        image: 'thar.jpg',
        features: ['Off-road', '4WD', 'Adventure Ready'],
        description: 'Rugged off-road vehicle for adventures',
        available: true
      },
      {
        name: 'BMW X5',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        price: 7400,
        category: 'SUV',
        fuel: 'Petrol',
        transmission: 'Automatic',
        seats: 7,
        doors: 5,
        image: 'bmw.webp',
        features: ['AC', 'GPS', 'Leather Seats', 'Sunroof'],
        description: 'Luxury SUV with premium comfort',
        available: true
      },
      {
        name: 'Hyundai Creta',
        brand: 'Hyundai',
        model: 'Creta',
        year: 2023,
        price: 5000,
        category: 'SUV',
        fuel: 'Diesel',
        transmission: 'Manual',
        seats: 5,
        doors: 5,
        image: 'cre.avif',
        features: ['AC', 'GPS', 'Bluetooth', 'Rear Camera'],
        description: 'Popular compact SUV with modern features',
        available: true
      },
      {
        name: 'Renault Kwid',
        brand: 'Renault',
        model: 'Kwid',
        year: 2022,
        price: 2500,
        category: 'Hatchback',
        fuel: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        doors: 5,
        image: 'kwid.jpg',
        features: ['AC', 'Bluetooth', 'USB'],
        description: 'Affordable and fuel-efficient hatchback',
        available: true
      },
      {
        name: 'Honda City',
        brand: 'Honda',
        model: 'City',
        year: 2023,
        price: 4400,
        category: 'Sedan',
        fuel: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        doors: 4,
        image: 'hon.jpg',
        features: ['AC', 'GPS', 'Sunroof', 'Bluetooth'],
        description: 'Premium sedan with elegant design',
        available: true
      },
      {
        name: 'Ford EcoSport',
        brand: 'Ford',
        model: 'EcoSport',
        year: 2022,
        price: 4000,
        category: 'SUV',
        fuel: 'Diesel',
        transmission: 'Manual',
        seats: 5,
        doors: 5,
        image: 'ec.webp',
        features: ['AC', 'GPS', 'Bluetooth', 'USB'],
        description: 'Compact SUV with good performance',
        available: true
      },
      {
        name: 'Tata Tiago',
        brand: 'Tata',
        model: 'Tiago',
        year: 2022,
        price: 2200,
        category: 'Hatchback',
        fuel: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        doors: 5,
        image: 'tiago.jpg',
        features: ['AC', 'Bluetooth', 'USB'],
        description: 'Budget-friendly hatchback with good features',
        available: true
      },
      {
        name: 'Toyota Fortuner',
        brand: 'Toyota',
        model: 'Fortuner',
        year: 2023,
        price: 11500,
        category: 'SUV',
        fuel: 'Diesel',
        transmission: 'Automatic',
        seats: 7,
        doors: 5,
        image: 'for.png',
        features: ['AC', 'GPS', 'Leather Seats', 'Sunroof'],
        description: 'Premium large SUV for ultimate comfort',
        available: true
      }
    ];

    const insertedCars = await Car.insertMany(sampleCars);
    console.log(`✅ Seeded database with ${insertedCars.length} cars`);
    
    res.json({ 
      success: true, 
      message: `Successfully seeded database with ${insertedCars.length} cars`,
      cars: insertedCars.length 
    });
  } catch (err) {
    console.error('❌ Error seeding cars:', err);
    res.status(500).json({ error: 'Failed to seed cars', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log('💳 Razorpay integration enabled');
  console.log('🔍 Test Razorpay config at: http://192.168.37.130:3001/api/test-razorpay');
  console.log('📊 Admin dashboard available at http://localhost:3000/admin');
  console.log('📦 Database: MongoDB on mongodb://192.168.37.130:27017/car_rental');
});
