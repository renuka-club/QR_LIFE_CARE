const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const rpName = 'QR Life Care';
const rpID = 'localhost';
const origin = process.env.FRONTEND_URL || 'http://localhost:3000';

exports.generateRegistration = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: new Uint8Array(Buffer.from(user.userId)),
            userName: user.email,
            attestationType: 'none',
            excludeCredentials: user.devices.filter(dev => dev.credentialID).map(dev => ({
                id: Buffer.from(dev.credentialID).toString('base64url'),
                type: 'public-key',
                transports: dev.transports,
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.status(200).json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyRegistration = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        const { body } = req;

        const expectedChallenge = user.currentChallenge;
        const expectedOrigin = req.get('origin') || origin;
        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin,
                expectedRPID: rpID,
            });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ success: false, message: error.message });
        }

        const { verified, registrationInfo } = verification;
        if (verified && registrationInfo) {
            const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;
            const newDevice = {
                credentialPublicKey: Buffer.from(credential.publicKey),
                credentialID: Buffer.from(credential.id, 'base64url'),
                counter: credential.counter,
                credentialDeviceType,
                credentialBackedUp,
                transports: credential.transports || body.response.transports || [],
            };

            const isDuplicate = user.devices.some(dev => dev.credentialID.toString('base64url') === credential.id);
            if (!isDuplicate) {
                user.devices.push(newDevice);
                user.currentChallenge = undefined;
                await user.save();
            }

            res.status(200).json({ success: true, message: 'Biometrics registered successfully!' });
        } else {
            res.status(400).json({ success: false, message: 'Verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateAuthentication = async (req, res) => {
    try {
        const { userId } = req.body;
        let user;

        if (userId) {
            user = await User.findOne({ userId: userId.toUpperCase() });
        } else if (req.user) {
            user = await User.findOne({ userId: req.user.userId });
        }

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.devices || user.devices.length === 0) {
            return res.status(400).json({ success: false, message: 'No biometrics registered for this user.' });
        }

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: user.devices.filter(dev => dev.credentialID).map(dev => ({
                id: Buffer.from(dev.credentialID).toString('base64url'),
                type: 'public-key',
                transports: dev.transports,
            })),
            userVerification: 'preferred',
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.status(200).json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyAuthentication = async (req, res) => {
    try {
        const { body } = req;

        // Custom body payload we send combining options response and userId
        const response = body.response;
        const userId = body.userId;

        let user = await User.findOne({ userId: userId.toUpperCase() });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const expectedChallenge = user.currentChallenge;
        const device = user.devices.find(dev => dev.credentialID.toString('base64') === Buffer.from(response.id, 'base64url').toString('base64'));

        if (!device) return res.status(400).json({ success: false, message: 'Device not recognized' });

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: response,
                expectedChallenge,
                expectedOrigin: req.get('origin') || origin,
                expectedRPID: rpID,
                credential: {
                    id: Buffer.from(device.credentialID).toString('base64url'),
                    publicKey: new Uint8Array(device.credentialPublicKey),
                    counter: device.counter,
                    transports: device.transports,
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ success: false, message: error.message });
        }

        const { verified, authenticationInfo } = verification;

        if (verified) {
            device.counter = authenticationInfo.newCounter;
            user.currentChallenge = undefined;
            await user.save();

            const token = generateToken(user.userId);

            res.status(200).json({
                success: true,
                data: {
                    userId: user.userId,
                    fullName: user.fullName,
                    token
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Authentication failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
