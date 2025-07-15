const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const router = express.Router();

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mc-ph';
const client = new MongoClient(uri);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB for authentication');
        return client.db('mc-ph');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };

        const result = await usersCollection.insertOne(newUser);

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: result.insertedId,
                email: newUser.email,
                name: newUser.name 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response (without password)
        const userResponse = {
            id: result.insertedId,
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        // Find user by email
        const user = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({ message: 'Account is disabled' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Update last login
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response (without password)
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            lastLogin: new Date()
        };

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        // Check if email is already taken by another user
        const existingUser = await usersCollection.findOne({ 
            email: email.toLowerCase(),
            _id: { $ne: new ObjectId(req.user.userId) }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email is already taken' });
        }

        // Update user
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { 
                $set: { 
                    name,
                    email: email.toLowerCase(),
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change password (protected route)
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        const db = await connectDB();
        const usersCollection = db.collection('users');

        // Get user
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { 
                $set: { 
                    password: hashedNewPassword,
                    updatedAt: new Date()
                }
            }
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout (protected route)
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        // For now, we'll just return success and let the client handle token removal
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Verify token (protected route)
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ 
        message: 'Token is valid',
        user: {
            id: req.user.userId,
            email: req.user.email,
            name: req.user.name
        }
    });
});

module.exports = router;