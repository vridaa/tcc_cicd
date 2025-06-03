import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const router = express.Router();

// Helper function to generate access token
const generateAccessToken = (id) => {
    return jwt.sign({ user: { id: id } }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Access token short-lived
};

// Helper function to generate refresh token
const generateRefreshToken = (id) => {
    return jwt.sign({ user: { id: id } }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // Refresh token long-lived
};

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ where: { username } });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = await User.create({
            username,
            password
        });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Save hashed refresh token to user in database
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10); // Hash refresh token before saving
        user.refreshToken = hashedRefreshToken;
        await user.save();

        res.cookie('jwtRefresh', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS)
            sameSite: 'strict', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
        });

        res.json({ token: accessToken });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);
    console.log('Received password:', password);

    try {
        let user = await User.findOne({ where: { username } });

        if (!user) {
            console.log('User not found:', username);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        console.log('User found. Stored hashed password:', user.password);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('bcrypt.compare result:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Save hashed refresh token to user in database (overwrite previous)
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        user.refreshToken = hashedRefreshToken;
        await user.save();

        res.cookie('jwtRefresh', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ token: accessToken });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public (accessible only with refresh cookie)
router.post('/refresh', async (req, res) => {
    const refreshTokenCookie = req.cookies?.jwtRefresh; // Get refresh token from cookie

    if (!refreshTokenCookie) return res.status(401).json({ msg: 'No refresh token found' });

    try {
        const decoded = jwt.verify(refreshTokenCookie, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findByPk(decoded.user.id);

        if (!user || !user.refreshToken) return res.status(403).json({ msg: 'Forbidden: User or refresh token not found' });

        // Compare refresh token from cookie with hashed refresh token in database
        const isMatch = await bcrypt.compare(refreshTokenCookie, user.refreshToken);

        if (!isMatch) return res.status(403).json({ msg: 'Forbidden: Invalid refresh token' });

        const newAccessToken = generateAccessToken(user.id);

        res.json({ token: newAccessToken });

    } catch (err) {
        console.error(err.message);
        res.status(403).json({ msg: 'Forbidden: Token verification failed' });
    }
});

// @route   POST api/auth/logout
// @desc    Clear refresh token and log user out
// @access  Private (accessible with refresh cookie)
router.post('/logout', async (req, res) => {
    const refreshTokenCookie = req.cookies?.jwtRefresh;

    if (!refreshTokenCookie) return res.status(204).json({ msg: 'No refresh token to clear' }); // No content

    try {
        const decoded = jwt.verify(refreshTokenCookie, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findByPk(decoded.user.id);

        if (user) {
            user.refreshToken = null; // Clear refresh token from database
            await user.save();
        }

        res.clearCookie('jwtRefresh', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        res.status(200).json({ msg: 'Logout successful' });

    } catch (err) {
        console.error(err.message);
        res.clearCookie('jwtRefresh', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' }); // Clear cookie even if token verification fails
        res.status(200).json({ msg: 'Logout successful' });
    }
});

export default router; 