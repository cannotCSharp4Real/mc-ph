const express = require('express');
const router = express.Router();
const { getDB } = require('../config/databaseMongoose');

// GET /api/test - Test API endpoint
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        
        if (!db) {
            return res.json({
                status: 'API Working',
                message: 'Coffee Shop API is running',
                database: 'Not connected',
                timestamp: new Date().toISOString()
            });
        }

        // Test database connection
        const result = await db.admin().ping();
        
        res.json({
            status: 'API Working',
            message: 'Coffee Shop API is running',
            database: 'Connected',
            dbName: db.databaseName,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'API Working',
            message: 'Coffee Shop API is running',
            database: 'Error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
