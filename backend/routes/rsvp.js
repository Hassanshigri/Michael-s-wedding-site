const express = require('express');
const { body, validationResult } = require('express-validator');
const { Guest, Activity } = require('../models');
const nodemailer = require('nodemailer');

const router = express.Router();

// Create email transporter (optional - only if all SMTP settings are provided)
let transporter = null;
let emailConfigured = false;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // Verify email connection
    transporter.verify((error, success) => {
        if (error) {
            console.warn('⚠️  Email configuration warning:', error.message);
            console.log('   Continuing without email support. Configure SMTP settings to enable emails.');
        } else {
            emailConfigured = true;
            console.log('✅ Email server ready');
        }
    });
} else {
    console.log('⚠️  Email not configured. Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable email notifications.');
}

/**
 * POST /api/rsvp/submit
 * Public endpoint for guests to submit RSVP
 */
router.post('/submit', [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('First name must be 2-100 characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 100 }),
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('attendance')
        .isIn(['yes', 'no'])
        .withMessage('Attendance must be yes or no'),
    body('guestCount')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Guest count must be 1-10'),
    body('meal')
        .optional()
        .isIn(['beef', 'chicken', 'fish', 'vegetarian', 'vegan', '']),
    body('phone')
        .optional()
        .trim()
        .isLength({ max: 20 }),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
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
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            phone: phone || null,
            attendance,
            guestCount: attendance === 'yes' ? (parseInt(guestCount) || 1) : 0,
            meal: attendance === 'yes' ? (meal || '') : '',
            dietary: Array.isArray(dietary) ? dietary : [],
            notes: notes || '',
            rsvpDate: new Date(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };

        let isUpdate = false;

        if (guest) {
            // Update existing guest
            const oldAttendance = guest.attendance;
            await guest.update(rsvpData);
            isUpdate = true;

            // Log update
            await Activity.create({
                type: 'update',
                description: `RSVP updated by ${firstName} ${lastName}: ${attendance} (was: ${oldAttendance})`,
                guestId: guest.id,
                metadata: { 
                    ip: req.ip,
                    isUpdate: true,
                    oldAttendance
                }
            });
        } else {
            // Create new guest
            guest = await Guest.create(rsvpData);

            // Log new RSVP
            await Activity.create({
                type: 'rsvp',
                description: `New RSVP from ${firstName} ${lastName}: ${attendance}`,
                guestId: guest.id,
                metadata: { 
                    ip: req.ip,
                    isNew: true
                }
            });
        }

        // Send confirmation email (don't fail if email fails)
        try {
            await sendConfirmationEmail(guest, isUpdate);
        } catch (emailError) {
            console.error('Confirmation email failed:', emailError);
            // Continue - RSVP is still successful
        }

        res.json({
            success: true,
            message: isUpdate ? 'RSVP updated successfully' : 'RSVP submitted successfully',
            guest: {
                id: guest.id,
                firstName: guest.firstName,
                lastName: guest.lastName,
                email: guest.email,
                attendance: guest.attendance,
                guestCount: guest.guestCount
            },
            isUpdate
        });

    } catch (error) {
        console.error('RSVP submission error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit RSVP. Please try again.' 
        });
    }
});

/**
 * GET /api/rsvp/check
 * Check if email already has an RSVP
 */
router.get('/check', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ 
            success: false,
            error: 'Email is required' 
        });
    }

    try {
        const guest = await Guest.findOne({ 
            where: { email: email.toLowerCase() },
            attributes: ['id', 'firstName', 'lastName', 'attendance', 'guestCount', 'meal', 'dietary', 'rsvpDate']
        });

        res.json({ 
            success: true,
            found: !!guest,
            rsvp: guest
        });

    } catch (error) {
        console.error('RSVP check error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to check RSVP status' 
        });
    }
});

/**
 * GET /api/rsvp/stats
 * Public stats for the website (no sensitive data)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            Guest.count({ where: { attendance: 'yes' } }),
            Guest.count({ where: { attendance: 'no' } }),
            Guest.count({ where: { attendance: 'pending' } }),
            Guest.sum('guestCount', { where: { attendance: 'yes' } })
        ]);

        // Get meal counts for attending guests
        const mealCounts = await Guest.findAll({
            where: { 
                attendance: 'yes',
                meal: { [Op.ne]: '' }
            },
            attributes: ['meal', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['meal'],
            raw: true
        });

        res.json({
            success: true,
            stats: {
                attending: stats[0],
                declined: stats[1],
                pending: stats[2],
                totalGuests: stats[3] || 0
            },
            mealCounts
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch statistics' 
        });
    }
});

/**
 * Send confirmation email
 */
async function sendConfirmationEmail(guest, isUpdate = false) {
    if (!process.env.SMTP_USER) {
        console.log('Email not configured, skipping confirmation');
        return;
    }

    const mealNames = {
        beef: 'Beef Tenderloin',
        chicken: 'Herb-Crusted Chicken',
        fish: 'Pan-Seared Salmon',
        vegetarian: 'Vegetarian Risotto',
        vegan: 'Vegan Delight'
    };

    const subject = isUpdate 
        ? '💕 Your Wedding RSVP Has Been Updated'
        : '💕 Wedding RSVP Confirmed - We\'re Excited to See You!';

    const html = guest.attendance === 'yes' 
        ? getAttendingEmailTemplate(guest, mealNames)
        : getDeclinedEmailTemplate(guest);

    // Send email only if configured
    if (emailConfigured && transporter) {
        try {
            await transporter.sendMail({
                from: `"Sarah & Michael" <${process.env.SMTP_USER}>`,
                to: guest.email,
                subject: subject,
                html: html
            });
        } catch (emailError) {
            console.warn('⚠️  Failed to send email to', guest.email, ':', emailError.message);
            // Continue without throwing - email is not critical
        }
    }
}

function getAttendingEmailTemplate(guest, mealNames) {
    const dietaryList = guest.dietary && guest.dietary.length > 0 
        ? `<p><strong>Dietary Restrictions:</strong> ${guest.dietary.join(', ')}</p>` 
        : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wedding RSVP Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', Georgia, serif; background-color: #FAFAFA; color: #2C3E2D;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FAFAFA;">
                <tr>
                    <td style="padding: 40px 20px; text-align: center;">
                        <h1 style="color: #9CAF88; font-size: 2.5rem; margin-bottom: 10px; font-weight: 400;">Sarah & Michael</h1>
                        <p style="color: #D4AF37; font-style: italic; margin-bottom: 30px; font-size: 1.1rem;">June 15, 2025 • Napa Valley</p>
                        
                        <div style="background: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); text-align: left;">
                            <h2 style="color: #9CAF88; margin-bottom: 20px; font-size: 1.8rem; font-weight: 400;">Thank You, ${guest.firstName}!</h2>
                            
                            <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;">
                                We're absolutely thrilled that you'll be joining us to celebrate our wedding! It means the world to us.
                            </p>
                            
                            <div style="background: #F4E7E7; padding: 25px; border-radius: 15px; margin: 25px 0;">
                                <h3 style="margin-top: 0; color: #2C3E2D; font-size: 1.2rem; margin-bottom: 15px;">Your RSVP Details:</h3>
                                <p style="margin: 8px 0;"><strong>Name:</strong> ${guest.firstName} ${guest.lastName}</p>
                                <p style="margin: 8px 0;"><strong>Number of Guests:</strong> ${guest.guestCount}</p>
                                <p style="margin: 8px 0;"><strong>Meal Selection:</strong> ${mealNames[guest.meal] || 'Not selected'}</p>
                                ${dietaryList}
                            </div>
                            
                            <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;">
                                <strong>Event Details:</strong><br>
                                📅 June 15, 2025 at 3:00 PM<br>
                                📍 The Garden Estate, Napa Valley<br>
                                👔 Semi-Formal / Garden Party Attire
                            </p>
                            
                            <p style="font-size: 1.1rem; line-height: 1.8;">
                                We'll send you more details about the venue, schedule, and any updates as we get closer to the big day. If you need to update your RSVP, simply visit our website and submit again with the same email.
                            </p>
                            
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://your-domain.com" style="display: inline-block; background: #9CAF88; color: white; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 0.95rem; letter-spacing: 1px;">Visit Our Website</a>
                            </div>
                        </div>
                        
                        <p style="text-align: center; color: #999; font-size: 0.9rem; margin-top: 30px; line-height: 1.6;">
                            Questions? Reply to this email or contact us at<br>
                            <a href="mailto:${process.env.SMTP_USER}" style="color: #9CAF88;">${process.env.SMTP_USER}</a>
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

function getDeclinedEmailTemplate(guest) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wedding RSVP Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Cormorant Garamond', Georgia, serif; background-color: #FAFAFA; color: #2C3E2D;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FAFAFA;">
                <tr>
                    <td style="padding: 40px 20px; text-align: center;">
                        <h1 style="color: #9CAF88; font-size: 2.5rem; margin-bottom: 10px; font-weight: 400;">Sarah & Michael</h1>
                        
                        <div style="background: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); text-align: left;">
                            <h2 style="color: #2C3E2D; margin-bottom: 20px; font-size: 1.8rem; font-weight: 400;">Thank You for Letting Us Know, ${guest.firstName}</h2>
                            
                            <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;">
                                We completely understand that you won't be able to join us on our special day. While we'll miss having you there, we truly appreciate you taking the time to respond.
                            </p>
                            
                            <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;">
                                If your plans change and you're able to make it, please don't hesitate to update your RSVP on our website. We'd love to have you celebrate with us if possible!
                            </p>
                            
                            <div style="background: #F4E7E7; padding: 20px; border-radius: 15px; margin: 25px 0; text-align: center;">
                                <p style="margin: 0; font-style: italic; color: #666;">
                                    "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day."
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://your-domain.com/rsvp.html" style="display: inline-block; background: #9CAF88; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 0.9rem;">Update RSVP</a>
                            </div>
                        </div>
                        
                        <p style="text-align: center; color: #999; font-size: 0.9rem; margin-top: 30px;">
                            With love,<br>Sarah & Michael
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

module.exports = router;