const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Get emergency user info (PUBLIC - no auth required)
// @route   GET /api/users/emergency/:userId
// @access  Public
router.get('/emergency/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return only emergency-relevant information
    res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        fullName: user.fullName,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        emergencyContact: user.emergencyContact,
        allergies: user.allergies,
        chronicConditions: user.chronicConditions,
        currentMedications: user.currentMedications
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;