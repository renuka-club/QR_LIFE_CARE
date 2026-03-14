exports.uploadReport = async (req, res) => {
  try {
    const { reportType, reportDate, doctorName, hospitalName, notes } = req.body;

    const FileModel = require('../models/File');
    const path = require('path');
    const newFiles = [];

    for (const file of req.files || []) {
      const ext = path.extname(file.originalname);
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;

      // Save file data to database
      await FileModel.create({
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: file.buffer
      });

      newFiles.push({
        filename,
        originalName: file.originalname,
        path: `uploads/${filename}`,
        size: file.size,
        mimetype: file.mimetype
      });
    }

    const existingReport = await Report.findOne({
      userId: req.user.userId,
      reportType,
      reportDate: new Date(reportDate)
    });

    if (existingReport) {
      existingReport.files.push(...newFiles);
      await existingReport.save();

      return res.status(200).json({
        success: true,
        message: 'Files appended to existing report',
        data: existingReport
      });
    }

    const report = await Report.create({
      userId: req.user.userId,
      reportType,
      reportDate,
      doctorName,
      hospitalName,
      notes,
      files: newFiles
    });

    res.status(201).json({
      success: true,
      message: 'New report created',
      data: report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
