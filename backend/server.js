const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// ===================================
// MIDDLEWARE
// ===================================

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://michaels-wedding.vercel.app', 'https://www.michaels-wedding.vercel.app', 'https://wedding-api.onrender.com']
        : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3001'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ===================================
// DATABASE CONNECTION
// ===================================

const { sequelize, testConnection } = require('./models');

// Test database connection
testConnection();

// ===================================
// API ROUTES
// ===================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: sequelize.options.dialect
    });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Guest management routes (protected)
app.use('/api/guests', require('./routes/guests'));

// Public RSVP routes
app.use('/api/rsvp', require('./routes/rsvp'));

// ===================================
// STATIC FILES (Frontend)
// ===================================

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===================================
// SPA ROUTING SUPPORT
// ===================================

// For any route that doesn't start with /api, serve index.html
// This enables client-side routing
app.get(/^\/(?!api).*/, (req, res) => {
    // Check if file exists, if not serve index.html
    const filePath = path.join(__dirname, '..', req.path);
    
    // Don't serve HTML files directly (let the router handle it)
    if (req.path.endsWith('.html') || req.path === '/') {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    } else {
        res.sendFile(filePath, (err) => {
            if (err) {
                res.sendFile(path.join(__dirname, '..', 'index.html'));
            }
        });
    }
});

// ===================================
// ERROR HANDLING
// ===================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;
    
    res.status(err.status || 500).json({ 
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ===================================
// START SERVER
// ===================================

const PORT = process.env.PORT || 3000;

// Sync database and start server
const startServer = async () => {
    try {
        // Sync database models (alter: true for development, false for production)
        await sequelize.sync({ 
            alter: process.env.NODE_ENV !== 'production',
            force: false // NEVER use force: true in production - it drops all tables!
        });
        
        console.log('✅ Database synchronized');
        
        // Create default admin if not exists
        const { Admin } = require('./models');
        const bcrypt = require('bcryptjs');
        
        const adminExists = await Admin.findOne({ 
            where: { username: process.env.ADMIN_USERNAME } 
        });
        
        if (!adminExists && process.env.ADMIN_PASSWORD_HASH) {
            await Admin.create({
                username: process.env.ADMIN_USERNAME,
                passwordHash: process.env.ADMIN_PASSWORD_HASH,
                email: process.env.SMTP_USER,
                role: 'owner'
            });
            console.log('✅ Default admin created');
        }
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🎉 Wedding Website API Server                        ║
║                                                        ║
║   Status: Running                                      ║
║   Port: ${PORT}                                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Database: PostgreSQL                                 ║
║                                                        ║
║   Endpoints:                                           ║
║   • Health:    http://localhost:${PORT}/api/health          ║
║   • Auth:      http://localhost:${PORT}/api/auth            ║
║   • Guests:    http://localhost:${PORT}/api/guests          ║
║   • RSVP:      http://localhost:${PORT}/api/rsvp            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// ===================================
// GRACEFUL SHUTDOWN
// ===================================

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    sequelize.close().then(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    sequelize.close().then(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});