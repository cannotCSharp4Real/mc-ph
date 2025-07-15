const express = require('express');
const router = express.Router();
const { getDB } = require('../config/databaseMongoose');

// GET /api/orders - Get all orders for a user
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        // In a real app, you'd get the user ID from the JWT token
        const userId = req.query.userId;
        
        const orders = await db.collection('orders').find({ userId }).sort({ orderDate: -1 }).toArray();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Error fetching order' });
    }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { userId, items, totalAmount, customerInfo, paymentMethod } = req.body;
        
        const newOrder = {
            userId,
            items,
            totalAmount: parseFloat(totalAmount),
            customerInfo,
            paymentMethod,
            status: 'pending',
            orderDate: new Date(),
            estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('orders').insertOne(newOrder);
        res.status(201).json({ ...newOrder, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const { status } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status,
                    updatedAt: new Date()
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
});

// DELETE /api/orders/:id - Cancel order
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status: 'cancelled',
                    updatedAt: new Date()
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Error cancelling order' });
    }
});

module.exports = router;
