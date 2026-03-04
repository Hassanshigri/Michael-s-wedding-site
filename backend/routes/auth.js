const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Admin, Activity } = require('../models');

const router = express.Router();

// Login
router.post('/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        // For demo, check against env variables or database
        let admin;
        
        if (username === process.env.ADMIN_USERNAME) {
            // Compare with hashed password from env
            const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Create or update admin record
            [admin] = await Admin.findOrCreate({
                where: { username },
                defaults: { 
                    username,
                    passwordHash: process.env.ADMIN_PASSWORD_HASH,
                    email: process.env.SMTP_USER
                }
            });
        } else {
            // Check database
            admin = await Admin.findOne({ where: { username } });
            if (!admin) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const isMatch = await bcrypt.compare(password, admin.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        // Update last login
        await admin.update({ lastLogin: new Date() });

        // Log activity
        await Activity.create({
            type: 'login',
            description: `Admin ${username} logged in`,
            metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
        });

        // Generate JWT
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;