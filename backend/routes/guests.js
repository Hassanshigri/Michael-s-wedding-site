const express = require('express');
const { body, validationResult } = require('express-validator');
const { Guest, Activity } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all guests with filters
router.get('/', async (req, res) => {
    try {
        const { 
            status, 
            meal, 
            table, 
            search,
            page = 1, 
            limit = 10 
        } = req.query;

        const where = {};
        
        if (status && status !== 'all') where.attendance = status;
        if (meal && meal !== 'all') where.meal = meal;
        if (table && table !== 'all') {
            if (table === 'unassigned') {
                where.table = null;
            } else {
                where.table = table;
            }
        }
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;
        
        const { count, rows: guests } = await Guest.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get stats
        const stats = await Promise.all([
            Guest.count(),
            Guest.count({ where: { attendance: 'yes' } }),
            Guest.count({ where: { attendance: 'no' } }),
            Guest.count({ where: { attendance: 'pending' } }),
            Guest.sum('guestCount', { where: { attendance: 'yes' } })
        ]);

        res.json({
            guests,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            },
            stats: {
                total: stats[0],
                attending: stats[1],
                declined: stats[2],
                pending: stats[3],
                totalGuests: stats[4] || 0
            }
        });
    } catch (error) {
        console.error('Get guests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single guest
router.get('/:id', async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        if (!guest) {
            return res.status(404).json({ error: 'Guest not found' });
        }
        res.json(guest);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create guest
router.post('/', [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail(),
    body('guestCount').optional().isInt({ min: 1, max: 10 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const guest = await Guest.create(req.body);
        
        await Activity.create({
            type: 'rsvp',
            description: `Guest ${guest.firstName} ${guest.lastName} added by admin`,
            guestId: guest.id
        });

        res.status(201).json(guest);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Update guest
router.put('/:id', async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        if (!guest) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        const oldData = { ...guest.toJSON() };
        await guest.update(req.body);

        await Activity.create({
            type: 'update',
            description: `Guest ${guest.firstName} ${guest.lastName} updated`,
            guestId: guest.id,
            metadata: { changes: req.body, old: oldData }
        });

        res.json(guest);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete guest
router.delete('/:id', async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        if (!guest) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        await guest.destroy();

        await Activity.create({
            type: 'delete',
            description: `Guest ${guest.firstName} ${guest.lastName} deleted`,
            metadata: { guest: guest.toJSON() }
        });

        res.json({ message: 'Guest deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Bulk operations
router.post('/bulk', async (req, res) => {
    const { action, ids } = req.body;
    
    try {
        switch(action) {
            case 'delete':
                await Guest.destroy({ where: { id: ids } });
                res.json({ message: `${ids.length} guests deleted` });
                break;
            case 'email':
                // Trigger email sending
                res.json({ message: `Emails queued for ${ids.length} guests` });
                break;
            default:
                res.status(400).json({ error: 'Unknown action' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Export guests
router.get('/export/csv', async (req, res) => {
    try {
        const guests = await Guest.findAll({
            order: [['lastName', 'ASC'], ['firstName', 'ASC']]
        });

        const csv = [
            ['First Name', 'Last Name', 'Email', 'Phone', 'Attendance', 'Guests', 'Meal', 'Table', 'Dietary', 'Notes', 'RSVP Date'].join(','),
            ...guests.map(g => [
                g.firstName,
                g.lastName,
                g.email,
                g.phone || '',
                g.attendance,
                g.guestCount,
                g.meal || '',
                g.table || '',
                (g.dietary || []).join('; '),
                `"${(g.notes || '').replace(/"/g, '""')}"`,
                g.rsvpDate ? new Date(g.rsvpDate).toISOString().split('T')[0] : ''
            ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=wedding-guests.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;