const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const Order = require('../models/Order');

// GET /api/orders - Get all orders with optional status filtering
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { status, userId } = req.query;
        
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (userId) {
            query.userId = userId;
        }
        
        const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
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
        const orderData = req.body;
        
        // Generate order number
        const orderNumber = `ORD${Date.now()}`;
        
        // Create order using the Order model
        const order = new Order({
            orderNumber,
            customerId: orderData.customerId ? new (require('mongodb').ObjectId)(orderData.customerId) : null,
            customerInfo: orderData.customerInfo,
            items: orderData.items,
            orderType: orderData.orderType,
            deliveryInfo: orderData.deliveryInfo,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            discount: orderData.discount || 0,
            total: orderData.total,
            specialInstructions: orderData.specialInstructions || '',
            estimatedPrepTime: orderData.estimatedPrepTime || 15,
            promoCode: orderData.promoCode || null,
            loyaltyPointsUsed: orderData.loyaltyPointsUsed || 0,
            loyaltyPointsEarned: Math.floor(orderData.total),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        const result = await order.save();
        
        // Return the created order with generated ID
        const createdOrder = {
            ...order,
            _id: result.insertedId
        };
        
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }
        
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status: status,
                    updatedAt: new Date(),
                    ...(status === 'completed' && { completedAt: new Date() })
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

// POST /api/orders/:id/notify - Send customer notification
router.post('/:id/notify', async (req, res) => {
    try {
        const { status } = req.body;
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        // Get order details
        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Send notification based on status
        let notificationMessage = '';
        switch (status) {
            case 'accepted':
                notificationMessage = `Your order #${order.orderNumber} has been accepted and is being prepared.`;
                break;
            case 'ready':
                notificationMessage = `Your order #${order.orderNumber} is ready for ${order.orderType === 'pickup' ? 'pickup' : 'delivery'}.`;
                break;
            case 'completed':
                notificationMessage = `Your order #${order.orderNumber} has been completed. Thank you!`;
                break;
            default:
                notificationMessage = `Your order #${order.orderNumber} status has been updated.`;
        }
        
        // In a real app, you would send email/SMS here
        // For now, we'll just log the notification
        console.log(`Notification sent to ${order.customerInfo.email}: ${notificationMessage}`);
        
        // Store notification in database for customer to view
        await db.collection('notifications').insertOne({
            orderId: order._id,
            customerId: order.customerId,
            customerEmail: order.customerInfo.email,
            message: notificationMessage,
            type: 'order_update',
            status: status,
            createdAt: new Date(),
            read: false
        });
        
        res.json({ message: 'Customer notification sent successfully' });
    } catch (error) {
        console.error('Error sending customer notification:', error);
        res.status(500).json({ message: 'Error sending customer notification' });
    }
});

// POST /api/staff/notifications - Handle staff notifications
router.post('/staff/notifications', async (req, res) => {
    try {
        const { type, orderId, customerName, orderType, items, total, timestamp } = req.body;
        
        // In a real app, you might store these in a database or send via WebSocket
        // For now, we'll just acknowledge receipt
        console.log(`Staff notification received: ${type} - Order ${orderId} from ${customerName}`);
        
        res.json({ message: 'Staff notification received successfully' });
    } catch (error) {
        console.error('Error handling staff notification:', error);
        res.status(500).json({ message: 'Error handling staff notification' });
    }
});

// POST /api/orders/check-inventory - Check inventory for items
router.post('/check-inventory', async (req, res) => {
    try {
        const { items } = req.body;
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        const inventoryChecks = await Promise.all(
            items.map(async (item) => {
                const product = await db.collection('products').findOne({ 
                    _id: new ObjectId(item.id) 
                });
                
                if (!product) {
                    return { 
                        id: item.id, 
                        available: false, 
                        message: 'Product not found' 
                    };
                }
                
                if (!product.inStock) {
                    return { 
                        id: item.id, 
                        available: false, 
                        message: `${product.name} is currently out of stock` 
                    };
                }
                
                return { 
                    id: item.id, 
                    available: true, 
                    message: 'Available' 
                };
            })
        );
        
        const unavailableItems = inventoryChecks.filter(check => !check.available);
        
        if (unavailableItems.length > 0) {
            return res.json({
                success: false,
                message: `Some items are not available: ${unavailableItems.map(item => item.message).join(', ')}`,
                unavailableItems
            });
        }
        
        res.json({ success: true, message: 'All items are available' });
    } catch (error) {
        console.error('Error checking inventory:', error);
        res.status(500).json({ success: false, message: 'Error checking inventory' });
    }
});

// GET /api/orders/customer/:customerId - Get customer's orders
router.get('/customer/:customerId', async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const customerId = new ObjectId(req.params.customerId);
        
        const orders = await db.collection('orders')
            .find({ customerId })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ message: 'Error fetching customer orders' });
    }
});

module.exports = router;
