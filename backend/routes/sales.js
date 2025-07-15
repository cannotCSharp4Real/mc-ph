const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// For now, let's create mock data for sales since we don't have actual sales yet
const mockSalesData = {
    todaySales: 2540,
    yesterdaySales: 2200,
    thisMonthSales: 45600,
    lastMonthSales: 42300,
    totalOrders: 127,
    avgOrderValue: 85.50,
    topProducts: [
        { name: 'Americano', sales: 45, revenue: 2250 },
        { name: 'Spanish Latte', sales: 38, revenue: 2660 },
        { name: 'Peanut Butter Crunch', sales: 25, revenue: 3250 }
    ]
};

// Middleware for JWT token verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware for admin role verification
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get sales summary
router.get('/summary', async (req, res) => {
    try {
        // For now, return mock data since we don't have actual sales yet
        const summary = {
            todaySales: mockSalesData.todaySales,
            yesterdaySales: mockSalesData.yesterdaySales,
            thisMonthSales: mockSalesData.thisMonthSales,
            lastMonthSales: mockSalesData.lastMonthSales,
            totalOrders: mockSalesData.totalOrders,
            avgOrderValue: mockSalesData.avgOrderValue,
            growthRate: ((mockSalesData.todaySales - mockSalesData.yesterdaySales) / mockSalesData.yesterdaySales * 100).toFixed(1),
            monthlyGrowth: ((mockSalesData.thisMonthSales - mockSalesData.lastMonthSales) / mockSalesData.lastMonthSales * 100).toFixed(1)
        };

        res.json(summary);
    } catch (error) {
        console.error('Error fetching sales summary:', error);
        res.status(500).json({ message: 'Error fetching sales summary' });
    }
});

// Get sales chart data
router.get('/chart/:period', async (req, res) => {
    try {
        const { period } = req.params;
        
        // Generate mock chart data based on period
        let chartData = [];
        
        if (period === 'daily') {
            // Last 7 days
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            chartData = days.map(day => ({
                label: day,
                sales: Math.floor(Math.random() * 500) + 300,
                orders: Math.floor(Math.random() * 20) + 10
            }));
        } else if (period === 'weekly') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - (i * 7));
                chartData.push({
                    label: `Week ${4 - i}`,
                    sales: Math.floor(Math.random() * 2000) + 1500,
                    orders: Math.floor(Math.random() * 80) + 40
                });
            }
        } else if (period === 'monthly') {
            // Last 6 months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            chartData = months.map(month => ({
                label: month,
                sales: Math.floor(Math.random() * 5000) + 3000,
                orders: Math.floor(Math.random() * 200) + 100
            }));
        }

        res.json(chartData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Error fetching chart data' });
    }
});

// Get products statistics
router.get('/products-stats', async (req, res) => {
    try {
        // For now, return mock data
        const stats = mockSalesData.topProducts.map(product => ({
            name: product.name,
            sales: product.sales,
            revenue: product.revenue,
            percentage: ((product.sales / 108) * 100).toFixed(1) // 108 total sales mock
        }));

        res.json(stats);
    } catch (error) {
        console.error('Error fetching products stats:', error);
        res.status(500).json({ message: 'Error fetching products stats' });
    }
});

// Get recent sales
router.get('/recent', async (req, res) => {
    try {
        // Mock recent sales data
        const recentSales = [
            {
                id: 'ORD-001',
                customerName: 'John Doe',
                items: ['Americano (Large)', 'Peanut Butter Crunch'],
                total: 180,
                paymentMethod: 'Card',
                time: '2 mins ago'
            },
            {
                id: 'ORD-002',
                customerName: 'Jane Smith',
                items: ['Spanish Latte (Medium)', 'Espresso Shot'],
                total: 150,
                paymentMethod: 'Cash',
                time: '5 mins ago'
            },
            {
                id: 'ORD-003',
                customerName: 'Mike Johnson',
                items: ['Americano (Small)'],
                total: 85,
                paymentMethod: 'GCash',
                time: '8 mins ago'
            }
        ];

        res.json(recentSales);
    } catch (error) {
        console.error('Error fetching recent sales:', error);
        res.status(500).json({ message: 'Error fetching recent sales' });
    }
});

// Get sales by payment method
router.get('/payment-methods', async (req, res) => {
    try {
        const paymentMethods = [
            { method: 'Card', count: 45, percentage: 35.4 },
            { method: 'Cash', count: 38, percentage: 29.9 },
            { method: 'GCash', count: 32, percentage: 25.2 },
            { method: 'PayMaya', count: 12, percentage: 9.4 }
        ];

        res.json(paymentMethods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ message: 'Error fetching payment methods' });
    }
});

module.exports = router;
