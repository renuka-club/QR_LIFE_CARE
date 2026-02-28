const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const User = require('../models/User');
const Report = require('../models/Report');

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../debug_log.txt');
const log = (msg) => {
  try {
    fs.appendFileSync(logFile, new Date().toISOString() + ' ' + msg + '\n');
  } catch (e) { console.error('Logging failed', e); }
};

// @desc    Upload report for specific user (PUBLIC – Emergency)
// @route   POST /api/reports/upload/:userId
const uploadMiddleware = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      log(`MULTER ERROR: ${err.message}`);
      console.error('MULTER ERROR:', err);
      return res.status(500).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
};

router.post('/upload/:userId', uploadMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    log(`[UPLOAD] Request received for user: ${userId}`);
    // console.log(`[UPLOAD] Request received for user: ${userId}`);
    // console.log('[UPLOAD] Body:', req.body);
    // console.log('[UPLOAD] Files:', req.files ? req.files.length : 0);

    const { reportType, reportDate, doctorName, hospitalName, notes } = req.body;

    let parsedDate = new Date();
    if (reportDate && !isNaN(new Date(reportDate).getTime())) {
      parsedDate = new Date(reportDate);
    }

    // 1️⃣ Verify user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2️⃣ Prepare files
    const files = (req.files || []).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    // 3️⃣ Check for existing report (IMPORTANT)
    const existingReport = await Report.findOne({
      userId,
      reportType,
      reportDate: parsedDate
    });

    if (existingReport) {
      // ✅ Append files instead of creating new report
      existingReport.files.push(...files);

      if (doctorName) existingReport.doctorName = doctorName;
      if (hospitalName) existingReport.hospitalName = hospitalName;
      if (notes) existingReport.notes = notes;

      await existingReport.save();

      return res.status(200).json({
        success: true,
        message: 'Files added to existing report',
        data: existingReport
      });
    }

    // 4️⃣ Create new report
    const report = await Report.create({
      userId,
      reportType,
      reportDate: parsedDate,
      doctorName,
      hospitalName,
      notes,
      files
    });

    res.status(201).json({
      success: true,
      message: 'New report created successfully',
      data: report
    });

  } catch (error) {
    log(`UPLOAD ERROR: ${error.message} \nStack: ${error.stack}`);
    console.error('UPLOAD ERROR:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: Object.values(error.errors).map(val => val.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all reports for specific user (PUBLIC)
// @route   GET /api/reports/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
