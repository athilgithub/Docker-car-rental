// Email configuration for Nodemailer
const nodemailer = require('nodemailer');

// Replace with your actual email and app password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

module.exports = transporter;
