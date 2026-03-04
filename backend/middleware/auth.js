const jwt = require('jsonwebtoken');

/**
 * Authentication middleware - verifies JWT token
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.' 
            });
        }

        // Check if it's a Bearer token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ 
                error: 'Invalid token format. Use: Bearer <token>' 
            });
        }

        const token = parts[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role || 'admin'
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired. Please login again.' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token.' 
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: 'Authentication error.' 
        });
    }
};

/**
 * Optional auth - doesn't require token but adds user if present
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Continue without user
        next();
    }
};

module.exports = authMiddleware;
module.exports.optional = optionalAuth;