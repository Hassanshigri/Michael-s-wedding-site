const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Admin, Activity } = require('../models');

const router = express.Router();

/**
 * POST /api/auth/login
 * Admin login - returns JWT token
 */
router.post('/login', [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be 3-50 characters'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 4 })
        .withMessage('Password must be at least 4 characters')
], async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { username, password } = req.body;

    try {
        let admin = null;
        let isMatch = false;

        // Check if using env credentials or database
        if (username === process.env.ADMIN_USERNAME) {
            // Compare with hashed password from env
            isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
            
            if (isMatch) {
                // Find or create admin in database
                [admin] = await Admin.findOrCreate({
                    where: { username },
                    defaults: { 
                        username,
                        passwordHash: process.env.ADMIN_PASSWORD_HASH,
                        email: process.env.SMTP_USER || null,
                        role: 'owner'
                    }
                });
            }
        } else {
            // Check database for other admins
            admin = await Admin.findOne({ 
                where: { username, isActive: true } 
            });
            
            if (admin) {
                isMatch = await bcrypt.compare(password, admin.passwordHash);
            }
        }

        // Invalid credentials
        if (!isMatch || !admin) {
            // Log failed attempt
            await Activity.create({
                type: 'login',
                description: `Failed login attempt for username: ${username}`,
                metadata: { 
                    ip: req.ip, 
                    userAgent: req.headers['user-agent'],
                    username 
                }
            });

            return res.status(401).json({ 
                success: false,
                error: 'Invalid username or password' 
            });
        }

        // Update last login
        await admin.update({ lastLogin: new Date() });

        // Log successful login
        await Activity.create({
            type: 'login',
            description: `Admin ${username} logged in successfully`,
            adminId: admin.id,
            metadata: { 
                ip: req.ip, 
                userAgent: req.headers['user-agent'] 
            }
        });

        // Generate JWT
        const token = jwt.sign(
            { 
                id: admin.id, 
                username: admin.username,
                role: admin.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Return success
        res.json({
            success: true,
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                lastLogin: admin.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error during login' 
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify if token is still valid
 */
router.post('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            valid: false,
            error: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if admin still exists and is active
        const admin = await Admin.findByPk(decoded.id);
        
        if (!admin || !admin.isActive) {
            return res.status(401).json({ 
                valid: false,
                error: 'Admin account no longer active' 
            });
        }

        res.json({ 
            valid: true, 
            user: {
                id: admin.id,
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(401).json({ 
            valid: false,
            error: 'Invalid or expired token' 
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, but we log it)
 */
router.post('/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            await Activity.create({
                type: 'login',
                description: `Admin ${decoded.username} logged out`,
                adminId: decoded.id,
                metadata: { ip: req.ip }
            });
        } catch (error) {
            // Token invalid, but we don't care on logout
        }
    }

    res.json({ 
        success: true,
        message: 'Logged out successfully' 
    });
});

/**
 * GET /api/auth/me
 * Get current admin info
 */
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'role', 'lastLogin', 'createdAt']
        });

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json({ user: admin });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;