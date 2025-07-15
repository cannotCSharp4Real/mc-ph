const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./backend/config/databaseMongoose');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable CSP for development
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes
app.use('/api/test', require('./backend/routes/test'));
app.use('/api/products', require('./backend/routes/products'));
app.use('/api/orders', require('./backend/routes/orders'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/sales', require('./backend/routes/sales'));
app.use('/api/auth', require('./backend/routes/auth').router);

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    // Check if the request is for a static file
    const filePath = path.join(__dirname, 'frontend', req.path);
    if (req.path.endsWith('.html') || req.path.endsWith('.css') || req.path.endsWith('.js')) {
        res.sendFile(filePath, (err) => {
            if (err) {
                res.status(404).json({ message: 'File not found' });
            }
        });
    } else {
        // For other routes, send the auth page as default
        res.sendFile(path.join(__dirname, 'frontend', 'auth.html'), (err) => {
            if (err) {
                res.status(404).json({ message: 'Page not found' });
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Coffee Shop server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
