const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Upload profile photo
router.post('/upload-photo', protect, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = req.user;
        const FileModel = require('../models/File');

        // Remove old photo from DB if exists
        if (user.profilePhoto) {
            const oldFilename = user.profilePhoto.replace('/uploads/', '');
            await FileModel.deleteOne({ filename: oldFilename });
        }

        const ext = path.extname(req.file.originalname);
        const filename = Date.now() + ext;

        // Save new photo to DB
        await FileModel.create({
            filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            data: req.file.buffer
        });

        user.profilePhoto = `/uploads/${filename}`;
        await user.save();

        res.json({ success: true, profilePhoto: user.profilePhoto });
    } catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove profile photo
router.delete('/remove-photo', protect, async (req, res) => {
    try {
        const user = req.user;
        const FileModel = require('../models/File');
        if (user.profilePhoto) {
            const oldFilename = user.profilePhoto.replace('/uploads/', '');
            await FileModel.deleteOne({ filename: oldFilename });
            user.profilePhoto = '';
            await user.save();
        }
        res.json({ success: true, message: 'Profile photo removed' });
    } catch (error) {
        console.error('Profile photo remove error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;