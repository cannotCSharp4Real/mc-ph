const { getDB } = require('../config/database');

class Order {
    constructor(orderData) {
        this.orderNumber = orderData.orderNumber || this.generateOrderNumber();
        this.customerId = orderData.customerId;
        this.customerInfo = orderData.customerInfo;
        this.items = orderData.items;
        this.subtotal = orderData.subtotal;
        this.tax = orderData.tax;
        this.discount = orderData.discount || 0;
        this.tip = orderData.tip || 0;
        this.total = orderData.total;
        this.paymentMethod = orderData.paymentMethod;
        this.paymentStatus = orderData.paymentStatus || 'pending';
        this.paymentId = orderData.paymentId || null;
        this.orderType = orderData.orderType || 'pickup'; // pickup, delivery, dine-in
        this.status = orderData.status || 'pending';
        this.priority = orderData.priority || 'normal';
        this.specialInstructions = orderData.specialInstructions || '';
        this.estimatedPrepTime = orderData.estimatedPrepTime || 15;
        this.estimatedReadyTime = orderData.estimatedReadyTime || new Date(Date.now() + 15 * 60 * 1000);
        this.actualReadyTime = orderData.actualReadyTime || null;
        this.deliveryInfo = orderData.deliveryInfo || null;
        this.assignedStaff = orderData.assignedStaff || null;
        this.loyaltyPointsUsed = orderData.loyaltyPointsUsed || 0;
        this.loyaltyPointsEarned = orderData.loyaltyPointsEarned || 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CF${timestamp}${random}`;
    }

    // Validation schema
    static getValidationSchema() {
        return {
            $jsonSchema: {
                bsonType: "object",
                required: ["orderNumber", "customerId", "items", "subtotal", "tax", "total", "paymentMethod", "customerInfo"],
                properties: {
                    orderNumber: {
                        bsonType: "string",
                        pattern: "^CF[0-9]{9}$",
                        description: "Unique order number"
                    },
                    customerId: {
                        bsonType: "objectId",
                        description: "Customer user ID"
                    },
                    customerInfo: {
                        bsonType: "object",
                        required: ["name", "email"],
                        properties: {
                            name: { bsonType: "string" },
                            email: { bsonType: "string" },
                            phone: { bsonType: ["string", "null"] }
                        }
                    },
                    items: {
                        bsonType: "array",
                        minItems: 1,
                        items: {
                            bsonType: "object",
                            required: ["productId", "name", "quantity", "price", "total"],
                            properties: {
                                productId: { bsonType: "objectId" },
                                name: { bsonType: "string" },
                                quantity: { bsonType: "int", minimum: 1 },
                                size: { bsonType: ["string", "null"] },
                                price: { bsonType: "double", minimum: 0 },
                                total: { bsonType: "double", minimum: 0 },
                                customizations: {
                                    bsonType: "array",
                                    items: {
                                        bsonType: "object",
                                        properties: {
                                            name: { bsonType: "string" },
                                            option: { bsonType: "string" },
                                            price: { bsonType: "double" }
                                        }
                                    }
                                },
                                specialInstructions: { bsonType: ["string", "null"] }
                            }
                        }
                    },
                    subtotal: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Subtotal before tax and discount"
                    },
                    tax: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Tax amount"
                    },
                    discount: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Discount amount"
                    },
                    tip: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Tip amount"
                    },
                    total: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Final total amount"
                    },
                    paymentMethod: {
                        bsonType: "string",
                        enum: ["cash", "card", "mobile-pay", "loyalty-points", "gift-card"],
                        description: "Payment method used"
                    },
                    paymentStatus: {
                        bsonType: "string",
                        enum: ["pending", "processing", "completed", "failed", "refunded"],
                        description: "Payment status"
                    },
                    paymentId: {
                        bsonType: ["string", "null"],
                        description: "Payment gateway transaction ID"
                    },
                    orderType: {
                        bsonType: "string",
                        enum: ["pickup", "delivery", "dine-in"],
                        description: "Order type"
                    },
                    status: {
                        bsonType: "string",
                        enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
                        description: "Order status"
                    },
                    priority: {
                        bsonType: "string",
                        enum: ["low", "normal", "high", "urgent"],
                        description: "Order priority"
                    },
                    specialInstructions: {
                        bsonType: "string",
                        maxLength: 500,
                        description: "Special instructions for the order"
                    },
                    estimatedPrepTime: {
                        bsonType: "int",
                        minimum: 1,
                        description: "Estimated preparation time in minutes"
                    },
                    estimatedReadyTime: {
                        bsonType: "date",
                        description: "Estimated ready time"
                    },
                    actualReadyTime: {
                        bsonType: ["date", "null"],
                        description: "Actual ready time"
                    },
                    deliveryInfo: {
                        bsonType: ["object", "null"],
                        properties: {
                            address: {
                                bsonType: "object",
                                required: ["street", "city", "zipCode"],
                                properties: {
                                    street: { bsonType: "string" },
                                    city: { bsonType: "string" },
                                    state: { bsonType: "string" },
                                    zipCode: { bsonType: "string" },
                                    instructions: { bsonType: ["string", "null"] }
                                }
                            },
                            deliveryFee: { bsonType: "double", minimum: 0 },
                            estimatedDeliveryTime: { bsonType: "date" },
                            actualDeliveryTime: { bsonType: ["date", "null"] },
                            deliveryPersonId: { bsonType: ["objectId", "null"] }
                        }
                    },
                    assignedStaff: {
                        bsonType: ["objectId", "null"],
                        description: "Staff member assigned to prepare the order"
                    },
                    loyaltyPointsUsed: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Loyalty points used for this order"
                    },
                    loyaltyPointsEarned: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Loyalty points earned from this order"
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "Order creation timestamp"
                    },
                    updatedAt: {
                        bsonType: "date",
                        description: "Last update timestamp"
                    }
                }
            }
        };
    }

    // Create indexes for the collection
    static async createIndexes() {
        const db = getDB();
        await db.collection('orders').createIndexes([
            { key: { orderNumber: 1 }, unique: true },
            { key: { customerId: 1 } },
            { key: { status: 1 } },
            { key: { paymentStatus: 1 } },
            { key: { orderType: 1 } },
            { key: { priority: 1 } },
            { key: { createdAt: -1 } },
            { key: { estimatedReadyTime: 1 } },
            { key: { assignedStaff: 1 } }
        ]);
    }

    // Static methods for database operations
    static async findById(id) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('orders').findOne({ _id: new ObjectId(id) });
    }

    static async findByOrderNumber(orderNumber) {
        const db = getDB();
        return await db.collection('orders').findOne({ orderNumber });
    }

    static async findByCustomerId(customerId) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('orders').find({ customerId: new ObjectId(customerId) })
            .sort({ createdAt: -1 }).toArray();
    }

    static async findByStatus(status) {
        const db = getDB();
        return await db.collection('orders').find({ status }).sort({ createdAt: -1 }).toArray();
    }

    static async findPendingOrders() {
        const db = getDB();
        return await db.collection('orders').find({ 
            status: { $in: ['pending', 'confirmed', 'preparing'] }
        }).sort({ priority: -1, createdAt: 1 }).toArray();
    }

    static async findOrdersByDateRange(startDate, endDate) {
        const db = getDB();
        return await db.collection('orders').find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ createdAt: -1 }).toArray();
    }

    static async updateStatus(orderId, status, staffId = null) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const updateData = { 
            status,
            updatedAt: new Date()
        };
        
        if (status === 'ready') {
            updateData.actualReadyTime = new Date();
        }
        
        if (staffId) {
            updateData.assignedStaff = new ObjectId(staffId);
        }
        
        return await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: updateData }
        );
    }

    static async updatePaymentStatus(orderId, paymentStatus, paymentId = null) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const updateData = { 
            paymentStatus,
            updatedAt: new Date()
        };
        
        if (paymentId) {
            updateData.paymentId = paymentId;
        }
        
        return await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: updateData }
        );
    }

    // Instance methods
    async save() {
        const db = getDB();
        const result = await db.collection('orders').insertOne(this);
        return result;
    }

    async update(updates) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        updates.updatedAt = new Date();
        return await db.collection('orders').updateOne(
            { _id: new ObjectId(this._id) },
            { $set: updates }
        );
    }

    calculateTotal() {
        return this.subtotal + this.tax - this.discount + this.tip;
    }

    calculateLoyaltyPoints() {
        // 1 point per dollar spent
        return Math.floor(this.total);
    }
}

module.exports = Order;
