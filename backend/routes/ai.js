const express = require('express');
const router = express.Router();
const { analyzeReportAI, aiChat, getReminders, getChatHistory, sendAnalysisEmail } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/analyze/:reportId', protect, analyzeReportAI);
router.post('/notify/:reportId', protect, sendAnalysisEmail);
router.post('/chat', protect, aiChat);
router.get('/chat', protect, getChatHistory);
router.get('/reminders', protect, getReminders);

module.exports = router;