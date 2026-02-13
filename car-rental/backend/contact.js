// backend/contact.js
// Simple Express backend for handling contact form submissions

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// POST /api/contact - handle contact form submissions
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  // Here you would typically send an email, save to DB, or notify admin
  // For demo, just log and return success
  console.log('Contact form submission:', { name, email, message });

  // Simulate async operation
  setTimeout(() => {
    res.json({ success: true, message: 'Message received! We will contact you soon.' });
  }, 500);
});

// Health check
app.get('/', (req, res) => {
  res.send('Contact backend is running.');
});

app.listen(PORT, () => {
  console.log(`Contact backend listening on port ${PORT}`);
});
