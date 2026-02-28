const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  mimetype: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const reportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  reportType: {
    type: String,
    required: true,
    enum: ['blood-test', 'x-ray', 'mri', 'prescription', 'ecg', 'ultrasound', 'other']
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  doctorName: {
    type: String,
    trim: true
  },
  hospitalName: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  files: [fileSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  aiAnalysis: {
    summary: String,
    keyFindings: [String],
    recommendations: [String],
    riskFactors: [String],
    medicines: [String],
    analyzedAt: Date
  }
});

module.exports = mongoose.model('Report', reportSchema);
