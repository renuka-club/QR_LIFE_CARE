exports.uploadReport = async (req, res) => {
  try {
    const { reportType, reportDate, doctorName, hospitalName, notes } = req.body;

    const newFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

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
