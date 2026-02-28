const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  medicationName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  timings: [{
    type: String
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  prescribedBy: String,
  notes: String,
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    lastReminder: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medication', medicationSchema);