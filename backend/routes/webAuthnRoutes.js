const express = require('express');
const router = express.Router();
const {
    generateRegistration,
    verifyRegistration,
    generateAuthentication,
    verifyAuthentication
} = require('../controllers/webAuthnController');
const { protect } = require('../middleware/auth');

// Note: Registration requires user to be logged in
router.get('/generate-registration-options', protect, generateRegistration);
router.post('/verify-registration', protect, verifyRegistration);

// Authentication can be public (if they provide userId via body)
router.post('/generate-authentication-options', generateAuthentication);
router.post('/verify-authentication', verifyAuthentication);

module.exports = router;
