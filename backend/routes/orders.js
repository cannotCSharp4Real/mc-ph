const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const Order = require('../models/Order');

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
        const orderData = req.body;
        
        // Create order using the Order model
        const order = new Order({
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
            loyaltyPointsEarned: Math.floor(orderData.total)
        });
        
        const result = await order.save();
        res.status(201).json({ ...order, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
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
                
                // Check if we have enough quantity (if quantity tracking is implemented)
                if (product.quantity && product.quantity < item.quantity) {
                    return { 
                        id: item.id, 
                        available: false, 
                        message: `Only ${product.quantity} of ${product.name} available` 
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
                message: unavailableItems[0].message,
                unavailableItems
            });
        }
        
        res.json({ success: true, message: 'All items are available' });
    } catch (error) {
        console.error('Error checking inventory:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking inventory' 
        });
    }
});

// POST /api/orders/send-confirmation - Send order confirmation email
router.post('/send-confirmation', async (req, res) => {
    try {
        const { orderId, email } = req.body;
        
        // In a real application, you would integrate with an email service
        // like SendGrid, AWS SES, or similar
        console.log(`Sending confirmation email to ${email} for order ${orderId}`);
        
        // Simulate email sending
        const emailSent = await simulateEmailSending(email, orderId);
        
        if (emailSent) {
            res.json({ success: true, message: 'Confirmation email sent' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send confirmation email' });
        }
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        res.status(500).json({ success: false, message: 'Error sending confirmation email' });
    }
});

// Simulate email sending (replace with actual email service)
async function simulateEmailSending(email, orderId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Email sent to ${email} for order ${orderId}`);
            resolve(true);
        }, 1000);
    });
}

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const result = await Order.updateStatus(req.params.id, status);
        
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
        const result = await Order.updateStatus(req.params.id, 'cancelled');
        
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
