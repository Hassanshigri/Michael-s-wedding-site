const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Guest, Activity } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/guests
 * Get all guests with filtering, pagination, and search
 */
router.get('/', async (req, res) => {
    try {
        const { 
            status, 
            meal, 
            table, 
            search,
            page = 1, 
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const where = {};
        
        // Filter by attendance status
        if (status && status !== 'all') {
            where.attendance = status;
        }
        
        // Filter by meal preference
        if (meal && meal !== 'all') {
            where.meal = meal;
        }
        
        // Filter by table assignment
        if (table && table !== 'all') {
            if (table === 'unassigned') {
                where.table = { [Op.is]: null };
            } else {
                where.table = table;
            }
        }
        
        // Search by name or email
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get guests with pagination
        const { count, rows: guests } = await Guest.findAndCountAll({
            where,
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get statistics
        const stats = await Promise.all([
            Guest.count(), // Total guests (records)
            Guest.count({ where: { attendance: 'yes' } }),
            Guest.count({ where: { attendance: 'no' } }),
            Guest.count({ where: { attendance: 'pending' } }),
            Guest.sum('guestCount', { where: { attendance: 'yes' } })
        ]);

        // Calculate meal counts
        const mealCounts = await Guest.findAll({
            where: { attendance: 'yes' },
            attributes: ['meal', [sequelize.fn('COUNT', sequelize.col('meal')), 'count']],
            group: ['meal'],
            raw: true
        });

        res.json({
            success: true,
            guests,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit)),
                limit: parseInt(limit)
            },
            stats: {
                totalRecords: stats[0],
                attending: stats[1],
                declined: stats[2],
                pending: stats[3],
                totalGuestCount: stats[4] || 0
            },
            mealCounts
        });

    } catch (error) {
        console.error('Get guests error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch guests' 
        });
    }
});

/**
 * GET /api/guests/stats
 * Get dashboard statistics
 */
router.get('/stats/dashboard', async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);

        const [
            totalGuests,
            attending,
            declined,
            pending,
            totalAttendingGuests,
            recentRSVPs,
            mealStats
        ] = await Promise.all([
            Guest.count(),
            Guest.count({ where: { attendance: 'yes' } }),
            Guest.count({ where: { attendance: 'no' } }),
            Guest.count({ where: { attendance: 'pending' } }),
            Guest.sum('guestCount', { where: { attendance: 'yes' } }),
            Guest.count({ 
                where: { 
                    rsvpDate: { [Op.gte]: thirtyDaysAgo } 
                } 
            }),
            Guest.findAll({
                where: { attendance: 'yes', meal: { [Op.ne]: '' } },
                attributes: ['meal', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['meal'],
                raw: true
            })
        ]);

        // Get RSVPs by date for chart
        const rsvpTimeline = await Guest.findAll({
            where: { 
                rsvpDate: { [Op.gte]: thirtyDaysAgo } 
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('rsvpDate')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('rsvpDate'))],
            order: [[sequelize.fn('DATE', sequelize.col('rsvpDate')), 'ASC']],
            raw: true
        });

        res.json({
            success: true,
            stats: {
                totalGuests,
                attending,
                declined,
                pending,
                totalAttendingGuests: totalAttendingGuests || 0,
                recentRSVPs,
                responseRate: totalGuests > 0 ? Math.round(((attending + declined) / totalGuests) * 100) : 0
            },
            mealStats,
            rsvpTimeline
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch statistics' 
        });
    }
});

/**
 * GET /api/guests/:id
 * Get single guest by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        
        if (!guest) {
            return res.status(404).json({ 
                success: false,
                error: 'Guest not found' 
            });
        }

        res.json({
            success: true,
            guest
        });

    } catch (error) {
        console.error('Get guest error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch guest' 
        });
    }
});

/**
 * POST /api/guests
 * Create new guest (admin only)
 */
router.post('/', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('guestCount').optional().isInt({ min: 1, max: 10 }).withMessage('Guest count must be 1-10'),
    body('attendance').optional().isIn(['yes', 'no', 'pending']),
    body('meal').optional().isIn(['beef', 'chicken', 'fish', 'vegetarian', 'vegan', ''])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    try {
        const guest = await Guest.create({
            ...req.body,
            rsvpDate: req.body.attendance !== 'pending' ? new Date() : null
        });
        
        // Log activity
        await Activity.create({
            type: 'rsvp',
            description: `Guest ${guest.firstName} ${guest.lastName} added by admin ${req.user.username}`,
            guestId: guest.id,
            adminId: req.user.id,
            metadata: { 
                ip: req.ip,
                admin: req.user.username
            }
        });

        res.status(201).json({
            success: true,
            guest
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                success: false,
                error: 'Email already exists' 
            });
        }
        console.error('Create guest error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create guest' 
        });
    }
});

/**
 * PUT /api/guests/:id
 * Update guest
 */
router.put('/:id', async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        
        if (!guest) {
            return res.status(404).json({ 
                success: false,
                error: 'Guest not found' 
            });
        }

        const oldData = { ...guest.toJSON() };
        
        // Update fields
        const updates = { ...req.body };
        
        // If attendance changed to yes/no, set rsvpDate
        if (updates.attendance && updates.attendance !== 'pending' && !guest.rsvpDate) {
            updates.rsvpDate = new Date();
        }

        await guest.update(updates);

        // Log activity
        await Activity.create({
            type: 'update',
            description: `Guest ${guest.firstName} ${guest.lastName} updated by ${req.user.username}`,
            guestId: guest.id,
            adminId: req.user.id,
            metadata: { 
                changes: updates,
                old: oldData,
                admin: req.user.username
            }
        });

        res.json({
            success: true,
            guest
        });

    } catch (error) {
        console.error('Update guest error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update guest' 
        });
    }
});

/**
 * DELETE /api/guests/:id
 * Delete guest
 */
router.delete('/:id', async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        
        if (!guest) {
            return res.status(404).json({ 
                success: false,
                error: 'Guest not found' 
            });
        }

        const guestInfo = `${guest.firstName} ${guest.lastName}`;

        await guest.destroy();

        // Log activity
        await Activity.create({
            type: 'delete',
            description: `Guest ${guestInfo} deleted by ${req.user.username}`,
            adminId: req.user.id,
            metadata: { 
                deletedGuest: guestInfo,
                email: guest.email,
                admin: req.user.username
            }
        });

        res.json({ 
            success: true,
            message: 'Guest deleted successfully' 
        });

    } catch (error) {
        console.error('Delete guest error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete guest' 
        });
    }
});

/**
 * POST /api/guests/bulk
 * Bulk operations on guests
 */
router.post('/bulk', async (req, res) => {
    const { action, ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'No guests selected' 
        });
    }

    try {
        switch(action) {
            case 'delete':
                const guestsToDelete = await Guest.findAll({
                    where: { id: ids },
                    attributes: ['id', 'firstName', 'lastName', 'email']
                });
                
                await Guest.destroy({ where: { id: ids } });
                
                // Log bulk delete
                await Activity.create({
                    type: 'delete',
                    description: `Bulk delete: ${ids.length} guests removed by ${req.user.username}`,
                    adminId: req.user.id,
                    metadata: { 
                        count: ids.length,
                        guests: guestsToDelete.map(g => `${g.firstName} ${g.lastName}`),
                        admin: req.user.username
                    }
                });
                
                res.json({ 
                    success: true,
                    message: `${ids.length} guests deleted` 
                });
                break;

            case 'email':
                // Queue emails (implement with your email service)
                res.json({ 
                    success: true,
                    message: `Emails queued for ${ids.length} guests` 
                });
                break;

            case 'export':
                const guestsToExport = await Guest.findAll({
                    where: { id: ids },
                    order: [['lastName', 'ASC'], ['firstName', 'ASC']]
                });
                res.json({ 
                    success: true,
                    guests: guestsToExport 
                });
                break;

            default:
                res.status(400).json({ 
                    success: false,
                    error: 'Unknown bulk action' 
                });
        }

    } catch (error) {
        console.error('Bulk operation error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Bulk operation failed' 
        });
    }
});

/**
 * GET /api/guests/export/csv
 * Export all guests to CSV
 */
router.get('/export/csv', async (req, res) => {
    try {
        const guests = await Guest.findAll({
            order: [['lastName', 'ASC'], ['firstName', 'ASC']]
        });

        // CSV Header
        const csvHeader = [
            'First Name', 'Last Name', 'Email', 'Phone', 
            'Attendance', 'Guests', 'Meal', 'Table', 
            'Dietary', 'Notes', 'RSVP Date', 'Created At'
        ].join(',');

        // CSV Rows
        const csvRows = guests.map(g => [
            `"${g.firstName}"`,
            `"${g.lastName}"`,
            `"${g.email}"`,
            `"${g.phone || ''}"`,
            g.attendance,
            g.guestCount,
            `"${g.meal || ''}"`,
            `"${g.table || ''}"`,
            `"${(g.dietary || []).join('; ')}"`,
            `"${(g.notes || '').replace(/"/g, '""')}"`,
            g.rsvpDate ? new Date(g.rsvpDate).toISOString().split('T')[0] : '',
            new Date(g.createdAt).toISOString().split('T')[0]
        ].join(','));

        const csv = [csvHeader, ...csvRows].join('\n');

        // Log export
        await Activity.create({
            type: 'export',
            description: `Guest list exported to CSV by ${req.user.username}`,
            adminId: req.user.id,
            metadata: { 
                count: guests.length,
                admin: req.user.username
            }
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=wedding-guests.csv');
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Export failed' 
        });
    }
});

module.exports = router;