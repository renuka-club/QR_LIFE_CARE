const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
    'http://localhost:3000',
    'https://qr-life-care.vercel.app'
  ].filter(Boolean),
  credentials: true
}));

// Serve uploaded files from Database instead of static folder
app.get('/uploads/:filename', async (req, res) => {
  try {
    const FileModel = require('./models/File');
    const file = await FileModel.findOne({ filename: req.params.filename });

    if (file) {
      // Set headers for correct file serving
      res.set('Content-Type', file.mimetype);
      res.set('Cache-Control', 'public, max-age=31557600'); // Cache for 1 year
      return res.send(file.data);
    }

    // Fallback to disk serving for old files before DB migration
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'uploads', req.params.filename);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    return res.status(404).send('File not found');
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).send('Server error serving file');
  }
});

// Mount routers

app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
// Add this line with other route imports
app.use('/api/users', require('./routes/users'));
app.use('/api/webauthn', require('./routes/webAuthnRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QR Life Care API is running'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});