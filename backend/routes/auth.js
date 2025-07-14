const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { getDB } = require('../config/databaseMongoose');

// Middleware for JWT token verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware for role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Insufficient permissions',
                required: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// POST /api/auth/register - Register new user
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const db = getDB();
        if (!db) {
            return res.status(503).json({ message: 'Database connection unavailable' });
        }

        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: 'customer', // default role
            preferences: {
                favoriteProducts: [],
                dietaryRestrictions: [],
                preferredSize: 'medium',
                notifications: {
                    email: true,
                    sms: false,
                    push: true
                }
            },
            loyaltyPoints: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.insertedId, email, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result.insertedId,
                name,
                email,
                role: 'customer'
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const db = getDB();
        if (!db) {
            return res.status(503).json({ message: 'Database connection unavailable' });
        }

        const { email, password } = req.body;

        // Find user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date(), updatedAt: new Date() } }
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            redirectTo: getRedirectPath(user.role)
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user' });
    }
});

// Helper function to determine redirect path based on role
function getRedirectPath(role) {
    switch (role) {
        case 'admin':
            return '/admin.html';
        case 'staff':
        case 'manager':
            return '/staff.html';
        case 'customer':
        default:
            return '/customer.html';
    }
}

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // by removing the token from localStorage/sessionStorage
        res.json({ 
            message: 'Logout successful',
            instructions: 'Please remove the token from client storage'
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Error during logout' });
    }
});

// GET /api/auth/profile - Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            return res.status(503).json({ message: 'Database connection unavailable' });
        }

        const { ObjectId } = require('mongodb');
        
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } } // Exclude password from response
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// GET /api/auth/verify - Verify token validity
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.userId,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Export middleware for use in other routes
module.exports = { 
    router, 
    authenticateToken, 
    requireRole 
};

// For backward compatibility
module.exports.default = router;
