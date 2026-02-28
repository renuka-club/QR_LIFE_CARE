const User = require('../models/User');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      age,
      gender,
      bloodGroup,
      password,
      emergencyContact,
      allergies,
      chronicConditions,
      currentMedications,
      doctorName,
      insuranceInfo
    } = req.body;

    const normalizedEmail = email.toLowerCase();

    // Create user ID
    const userId = fullName.replace(/\s+/g, '').toUpperCase() + age;

    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this name and age already exists. Please use Login.'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists. Please use Login.'
      });
    }

    // Create user
    const user = await User.create({
      userId,
      fullName,
      email: normalizedEmail,
      age,
      gender,
      bloodGroup,
      password,
      emergencyContact,
      allergies,
      chronicConditions,
      currentMedications,
      doctorName,
      insuranceInfo
    });

    // Generate QR Code
    const qrData = {
      userId: user.userId,
      name: user.fullName,
      bloodGroup: user.bloodGroup,
      emergencyContact: user.emergencyContact,
      allergies: user.allergies,
      chronicConditions: user.chronicConditions,
      url: `${process.env.FRONTEND_URL}/emergency/${user.userId}`
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    user.qrCode = qrCodeDataUrl;
    user.qrCodeUrl = qrData.url;
    await user.save();

    // Generate token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const token = generateToken(user.userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user.userId,
        fullName: user.fullName,
        qrCode: user.qrCode,
        qrCodeUrl: user.qrCodeUrl,
        token
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = error.keyValue ? Object.keys(error.keyValue)[0] : 'field';
      return res.status(400).json({
        success: false,
        message: `Duplicate value entered for ${field}. User already exists.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validate input
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and password'
      });
    }

    // Check for user (include password in query)
    const user = await User.findOne({ userId: userId.toUpperCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.userId);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        fullName: user.fullName,
        token
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
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });

    res.status(200).json({
      success: true,
      data: user
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