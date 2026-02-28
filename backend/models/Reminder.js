const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: {
        type: String, // Using String as per User schema userId
        required: true,
        ref: 'User'
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    },
    type: {
        type: String,
        enum: ['medication', 'appointment', 'lifestyle', 'alert'],
        default: 'alert'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date
    },
    isRead: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'dismissed'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reminder', reminderSchema);
