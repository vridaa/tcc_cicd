import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const router = express.Router();

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

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

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

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router; 