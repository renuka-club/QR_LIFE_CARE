const Report = require('../models/Report');
const Reminder = require('../models/Reminder');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User'); // Import User model to get email
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper: Send Email
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);

    if (error.responseCode === 535) {
      console.error('💡 HINT: For Gmail, you must use an "App Password" if 2-Step Verification is on. Your regular password will not work.');
      console.error('   Generate one here: https://myaccount.google.com/apppasswords');
    }

    // Fallback: Log email to file/console for debugging
    const logPath = path.join(__dirname, '../debug/email_log.txt');
    const simulatedEmail = `
    [SIMULATED EMAIL FAILOVER]
    To: ${to}
    Subject: ${subject}
    ---------------------------------------------------
    ${html.replace(/<[^>]*>/g, '')} 
    ---------------------------------------------------
    (Full HTML content processing skipped for log)
    `;

    console.log(simulatedEmail);
    try { fs.appendFileSync(logPath, simulatedEmail + '\n\n'); } catch (e) { }

    return false;
  }
};

// Gemini AI analysis
const analyzeReportWithGemini = async (report) => {
  const logPath = path.join(__dirname, '../debug/ai_log.txt');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      throw new Error("AI service unavailable");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for speed and multimodal capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare text prompt
    const textPart = {
      text: `
      You are an expert Medical AI Assistant.
      Analyze the following medical report information (and attached images if any) and provide a structured health summary, key findings, recommendations, and suggested medicines.
      
      Patient Context:
      - Report Type: ${report.reportType}
      - Doctor Name: ${report.doctorName || 'N/A'}
      - Hospital: ${report.hospitalName || 'N/A'}
      - Date: ${new Date(report.reportDate).toLocaleDateString()}
      - User Notes: ${report.notes || 'No notes provided. Base analysis on report type.'}
      - Files Attached: ${report.files.map(f => f.originalName).join(', ')}

      Task:
      1. Carefully analyze the provided image(s) if available. Extract detailed medical data, numbers, or observations from them.
      2. Summarize the likely purpose of this report.
      3. Identify key findings (abnormalities, normal ranges, etc).
      4. Identify the likely disease or condition based on the findings.
      5. Suggest generic medicines or supplements if relevant (e.g. 'Vitamin C'). If strictly prescription-only, advise consulting a doctor.
      6. Identify potential critical risk factors.
      7. GENERATE ACTIONABLE DAILY REMINDERS: Based on the identified disease/condition, create practical, scheduled reminders for the patient. 
         - Include medication timings (e.g., "Take Paracetamol after breakfast at 9 AM").
         - Include lifestyle habits (e.g., "Drink 1 glass of water every 2 hours", "Do breathing exercises at 6 PM").

      Output Format (Strict valid JSON only, no markdown):
      {
        "summary": "...",
        "keyFindings": ["..."],
        "recommendations": ["..."],
        "riskFactors": ["..."],
        "medicines": ["..."],
        "reminders": [
          { 
              "title": "...", 
              "message": "...", 
              "type": "medication" | "appointment" | "alert" | "lifestyle",
              "timeOfAction": "8:00 AM" // Provide a specific time, like "8 AM", "2:00 PM"
          }
        ]
      }
    `};

    // Prepare image parts
    const imageParts = [];
    if (report.files && report.files.length > 0) {
      for (const file of report.files) {
        // Only process images
        if (file.mimetype.startsWith('image/')) {
          try {
            const FileModel = require('../models/File');
            const dbFile = await FileModel.findOne({ filename: file.filename });

            if (dbFile) {
              const imagePart = {
                inlineData: {
                  data: dbFile.data.toString('base64'),
                  mimeType: dbFile.mimetype
                }
              };
              imageParts.push(imagePart);
            } else {
              const imagePath = path.resolve(__dirname, '..', file.path);
              if (fs.existsSync(imagePath)) {
                const fileData = fs.readFileSync(imagePath);
                const imagePart = {
                  inlineData: {
                    data: fileData.toString('base64'),
                    mimeType: file.mimetype
                  }
                };
                imageParts.push(imagePart);
              } else {
                try { fs.appendFileSync(logPath, `[IMAGE MISSING] ${file.path}\n`); } catch (e) { }
              }
            }
          } catch (err) {
            console.error(`Failed to read image file: ${file.path}`, err);
            try { fs.appendFileSync(logPath, `[IMAGE READ ERROR] ${err.message}\n`); } catch (e) { }
          }
        }
      }
    }

    // Combine parts: [text, ...images]
    const parts = [textPart, ...imageParts];

    // Debug log
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] Sending ${imageParts.length} images. Report ID: ${report._id}\n`);
    } catch (e) { }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Cleanup JSON string (remove markdown code blocks if present)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", jsonStr);
      try { fs.appendFileSync(logPath, `[JSON Parse Error] ${jsonStr}\n`); } catch (e) { }

      data = {
        summary: "Raw analysis: " + jsonStr.substring(0, 200) + "...",
        keyFindings: ["Could not parse structured data"],
        recommendations: [],
        riskFactors: [],
        medicines: [],
        reminders: []
      };
    }

    return data;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    try {
      fs.appendFileSync(logPath, `[GEMINI ERROR] ${error.message}\nStack: ${error.stack}\n`);
    } catch (e) { }

    // Fallback if AI fails
    return {
      summary: "AI analysis unavailable. Please review the report manually.",
      keyFindings: ["Manual review recommended"],
      recommendations: ["Consult your doctor"],
      riskFactors: [],
      medicines: [],
      reminders: []
    };
  }
};

// @desc    Analyze report with AI
// @route   POST /api/ai/analyze/:reportId
// @access  Private
exports.analyzeReportAI = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Verify ownership
    if (report.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Perform AI analysis
    const analysis = await analyzeReportWithGemini(report);

    report.aiAnalysis = {
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      recommendations: analysis.recommendations,
      riskFactors: analysis.riskFactors,
      medicines: analysis.medicines || [],
      analyzedAt: new Date().toISOString()
    };

    await report.save();

    // Generate Reminders from AI data
    if (analysis.reminders && analysis.reminders.length > 0) {
      const reminderPromises = analysis.reminders.map(rem => {
        let reminderDate = new Date();

        // If the AI provides a specific time (e.g., "09:00" or "9 AM"), try to set it for today or tomorrow.
        if (rem.timeOfAction) {
          const timeStr = rem.timeOfAction.toString().toLowerCase();
          let hours = 9; // Default 9 AM
          let mins = 0;

          const hrMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
          if (hrMatch) {
            let parsedHr = parseInt(hrMatch[1]);
            const parsedMin = parseInt(hrMatch[2] || 0);
            const ampm = hrMatch[3];

            if (ampm === 'pm' && parsedHr < 12) parsedHr += 12;
            if (ampm === 'am' && parsedHr === 12) parsedHr = 0;

            hours = parsedHr;
            mins = parsedMin;
          }

          reminderDate.setHours(hours, mins, 0, 0);

          // If the parsed time has already passed today, schedule it for tomorrow
          if (reminderDate.getTime() < new Date().getTime()) {
            reminderDate.setDate(reminderDate.getDate() + 1);
          }
        } else {
          // Default to tomorrow if no time specified
          reminderDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
        }

        return Reminder.create({
          userId: req.user.userId,
          reportId: report._id,
          type: rem.type || 'alert',
          title: rem.title,
          message: rem.message,
          dateTime: reminderDate
        });
      });
      await Promise.all(reminderPromises);
    }

    // --- SEND EMAIL NOTIFICATION ---
    const user = await User.findById(req.user._id);
    if (user && user.email) {
      const emailSubject = `AI Analysis Result: ${report.reportType.toUpperCase()}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #007bff;">QR Life Care - Medical Report Analysis</h2>
          <p>Hello <strong>${user.fullName}</strong>,</p>
          <p>Your medical report (<strong>${report.reportType}</strong>) from <strong>${new Date(report.reportDate).toLocaleDateString()}</strong> has been analyzed by our AI.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <h3>📝 Summary</h3>
          <p>${analysis.summary}</p>
          
          <h3>💊 Suggested Medications</h3>
          <ul>
            ${(analysis.medicines || []).map(m => `<li>${m}</li>`).join('') || '<li>No specific medicines suggested.</li>'}
          </ul>
          
          <h3>🔍 Key Findings</h3>
          <ul>
             ${(analysis.keyFindings || []).map(k => `<li>${k}</li>`).join('')}
          </ul>

          <div style="margin-top: 20px; font-size: 0.9em; color: #777;">
            <p><strong>Disclaimer:</strong> This is an AI-generated summary and does not replace professional medical advice. Please consult your doctor.</p>
          </div>
        </div>
      `;
      // Send asynchronously, don't block response
      sendEmail(user.email, emailSubject, emailHtml).catch(err => console.error("Async email error:", err));
    }

    res.status(200).json({
      success: true,
      message: 'AI analysis completed',
      data: report.aiAnalysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send analysis email manually
// @route   POST /api/ai/notify/:reportId
// @access  Private
exports.sendAnalysisEmail = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!report.aiAnalysis) {
      return res.status(400).json({ success: false, message: 'No AI analysis found for this report. Analyze it first.' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'User email not found.' });
    }

    const analysis = report.aiAnalysis;
    const emailSubject = `AI Analysis Result: ${report.reportType.toUpperCase()}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #007bff;">QR Life Care - Medical Report Analysis</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>Here is the requested copy of your AI analysis for the <strong>${report.reportType}</strong> report from <strong>${new Date(report.reportDate).toLocaleDateString()}</strong>.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <h3>📝 Summary</h3>
        <p>${analysis.summary}</p>
        
        <h3>💊 Suggested Medications</h3>
        <ul>
          ${(analysis.medicines || []).map(m => `<li>${m}</li>`).join('') || '<li>No specific medicines suggested.</li>'}
        </ul>
        
        <h3>🔍 Key Findings</h3>
        <ul>
            ${(analysis.keyFindings || []).map(k => `<li>${k}</li>`).join('')}
        </ul>

        <div style="margin-top: 20px; font-size: 0.9em; color: #777;">
          <p><strong>Disclaimer:</strong> This is an AI-generated summary and does not replace professional medical advice. Please consult your doctor.</p>
        </div>
      </div>
    `;

    const emailSent = await sendEmail(user.email, emailSubject, emailHtml);

    if (emailSent) {
      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email. Check server logs.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get AI Reminders
// @route   GET /api/ai/reminders
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    AI Chat
// @route   POST /api/ai/chat
// @access  Private
exports.aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    console.log("AI Chat Request received:", message);

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Save User Message
    try {
      await ChatMessage.create({
        userId: req.user.userId,
        sender: 'user',
        text: message
      });
      console.log("User message saved to DB");
    } catch (e) {
      console.error("Error saving User Message:", e.message);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText = '';

    if (!apiKey) {
      aiResponseText = "I'm currently running in offline mode. Please check your system configuration.";
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash for speed/quality balance
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Construct a prompt for a health assistant
      const prompt = `
        You are a helpful and empathetic Medical AI Assistant named 'QR Health Bot'.
        Your goal is to assist users with general health information, explain medical terms, and provide guidance on healthy living.
        
        User Query: "${message}"

        Guidelines:
        1. Provide accurate, general medical information.
        2. Do NOT diagnose specific conditions or prescribe medications. Always advise seeing a doctor for specific concerns.
        3. Be concise but helpful.
        4. If the user asks about their specific reports, explain that you can analyze reports if they go to the "Medical Records" page and click "Analyze", but here you are answering general questions.

        Response:
      `;

      console.log("Gemini prompt sent, waiting for response...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponseText = response.text();
      console.log("AI Response received from Gemini");
    }

    // Save AI Response
    try {
      await ChatMessage.create({
        userId: req.user.userId,
        sender: 'ai',
        text: aiResponseText
      });
      console.log("AI message saved to DB");
    } catch (e) {
      console.error("Error saving AI Message:", e.message);
    }

    res.status(200).json({
      success: true,
      data: {
        message: aiResponseText,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get Chat History
// @route   GET /api/ai/chat
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const history = await ChatMessage.find({ userId: req.user.userId })
      .sort({ timestamp: 1 })
      .limit(50); // Limit to last 50 messages

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error("Get Chat History Error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};