// backend/routes/auth.js
// Hash passwords manually - NO middleware issues

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Generate token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    console.log('\n📝 Signup attempt:', req.body.email);
    
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 6 characters' 
            });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already registered' 
            });
        }
        
        // Manually hash the password (NO middleware!)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user with hashed password
        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword
        });
        
        // Generate token
        const token = generateToken(user._id);
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        
        console.log('✅ User created successfully:', email);
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: user.getPublicInfo(),
            token: token
        });
        
    } catch (error) {
        console.error('❌ Signup error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    console.log('\n🔐 Login attempt:', req.body.email);
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password required' 
            });
        }
        
        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }
        
        // Check password using bcrypt directly
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }
        
        // Update last login
        user.lastLogin = Date.now();
        await user.save();
        
        // Generate token
        const token = generateToken(user._id);
        
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        
        console.log('✅ User logged in:', email);
        
        res.json({
            success: true,
            message: 'Logged in successfully!',
            user: user.getPublicInfo(),
            token: token
        });
        
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// LOGOUT ROUTE
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// GET CURRENT USER
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.json({ success: true, user: null });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.json({ success: true, user: null });
        }
        
        res.json({ success: true, user: user.getPublicInfo() });
        
    } catch (error) {
        res.json({ success: true, user: null });
    }
});

module.exports = router;