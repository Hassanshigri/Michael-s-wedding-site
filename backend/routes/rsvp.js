const express = require('express');
const { body, validationResult } = require('express-validator');
const { Guest, Activity } = require('../models');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Submit RSVP (public - no auth required)
router.post('/submit', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('attendance').isIn(['yes', 'no']).withMessage('Attendance must be yes or no'),
    body('guestCount').optional().isInt({ min: 1, max: 10 }),
    body('meal').optional().isIn(['beef', 'chicken', 'fish', 'vegetarian', 'vegan', ''])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            attendance,
            guestCount,
            meal,
            dietary,
            notes
        } = req.body;

        // Check if guest already exists
        let guest = await Guest.findOne({ where: { email } });
        
        const rsvpData = {
            firstName,
            lastName,
            email,
            phone: phone || null,
            attendance,
            guestCount: attendance === 'yes' ? (parseInt(guestCount) || 1) : 0,
            meal: attendance === 'yes' ? meal : '',
            dietary: dietary || [],
            notes: notes || '',
            rsvpDate: new Date(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };

        if (guest) {
            // Update existing
            await guest.update(rsvpData);
        } else {
            // Create new
            guest = await Guest.create(rsvpData);
        }

        // Log activity
        await Activity.create({
            type: 'rsvp',
            description: `RSVP received from ${firstName} ${lastName}: ${attendance}`,
            guestId: guest.id,
            metadata: { ip: req.ip }
        });

        // Send confirmation email
        try {
            await transporter.sendMail({
                from: `"Sarah & Michael" <${process.env.SMTP_USER}>`,
                to: email,
                subject: attendance === 'yes' 
                    ? '💕 Wedding RSVP Confirmed - We\'re Excited to See You!' 
                    : 'Wedding RSVP Received',
                html: getConfirmationEmail(firstName, attendance, guestCount, meal)
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);
            // Don't fail the RSVP if email fails
        }

        res.json({
            success: true,
            message: 'RSVP submitted successfully',
            guest: {
                id: guest.id,
                firstName: guest.firstName,
                lastName: guest.lastName,
                attendance: guest.attendance
            }
        });
    } catch (error) {
        console.error('RSVP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get RSVP stats (public)
router.get('/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            Guest.count({ where: { attendance: 'yes' } }),
            Guest.count({ where: { attendance: 'no' } }),
            Guest.count({ where: { attendance: 'pending' } }),
            Guest.sum('guestCount', { where: { attendance: 'yes' } })
        ]);

        res.json({
            attending: stats[0],
            declined: stats[1],
            pending: stats[2],
            totalGuests: stats[3] || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Check existing RSVP by email
router.get('/check', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    try {
        const guest = await Guest.findOne({ 
            where: { email },
            attributes: ['id', 'firstName', 'lastName', 'attendance', 'guestCount', 'meal', 'rsvpDate']
        });

        res.json({ 
            found: !!guest,
            rsvp: guest
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

function getConfirmationEmail(firstName, attendance, guestCount, meal) {
    const mealNames = {
        beef: 'Beef Tenderloin',
        chicken: 'Herb-Crusted Chicken',
        fish: 'Pan-Seared Salmon',
        vegetarian: 'Vegetarian Risotto',
        vegan: 'Vegan Delight'
    };

    if (attendance === 'yes') {
        return `
            <div style="font-family: 'Cormorant Garamond', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FAFAFA; color: #2C3E2D;">
                <h1 style="color: #9CAF88; font-size: 2.5rem; text-align: center; margin-bottom: 10px;">Sarah & Michael</h1>
                <p style="text-align: center; color: #D4AF37; font-style: italic; margin-bottom: 30px;">June 15, 2025 • Napa Valley</p>
                
                <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
                    <h2 style="color: #9CAF88; margin-bottom: 20px;">Thank You, ${firstName}!</h2>
                    <p style="font-size: 1.1rem; line-height: 1.8;">We're so excited that you'll be joining us to celebrate our wedding!</p>
                    
                    <div style="background: #F4E7E7; padding: 20px; border-radius: 15px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #2C3E2D;">Your RSVP Details:</h3>
                        <p><strong>Guests:</strong> ${guestCount}</p>
                        <p><strong>Meal Selection:</strong> ${mealNames[meal] || 'Not selected'}</p>
                    </div>
                    
                    <p style="font-size: 1.1rem; line-height: 1.8;">We'll send you more details about the venue, schedule, and any updates as we get closer to the big day.</p>
                    
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="https://your-domain.com" style="display: inline-block; background: #9CAF88; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: 600;">Visit Our Website</a>
                    </p>
                </div>
                
                <p style="text-align: center; color: #999; font-size: 0.9rem; margin-top: 30px;">
                    Questions? Reply to this email or contact us at wedding@sarahandmichael.com
                </p>
            </div>
        `;
    } else {
        return `
            <div style="font-family: 'Cormorant Garamond', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FAFAFA; color: #2C3E2D;">
                <h1 style="color: #9CAF88; font-size: 2.5rem; text-align: center; margin-bottom: 10px;">Sarah & Michael</h1>
                
                <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
                    <h2 style="color: #2C3E2D; margin-bottom: 20px;">Thank You for Letting Us Know, ${firstName}</h2>
                    <p style="font-size: 1.1rem; line-height: 1.8;">We're sorry you won't be able to join us, but we understand and appreciate you taking the time to respond.</p>
                    <p style="font-size: 1.1rem; line-height: 1.8;">If your plans change, please don't hesitate to update your RSVP on our website.</p>
                </div>
            </div>
        `;
    }
}

module.exports = router;