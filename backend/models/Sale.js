const { getDB } = require('../config/databaseMongoose');

class Sale {
    constructor(saleData) {
        this.orderId = saleData.orderId;
        this.orderNumber = saleData.orderNumber;
        this.customerId = saleData.customerId;
        this.customerInfo = saleData.customerInfo;
        this.staffId = saleData.staffId;
        this.staffName = saleData.staffName;
        this.items = saleData.items;
        this.subtotal = saleData.subtotal;
        this.tax = saleData.tax;
        this.discount = saleData.discount || 0;
        this.tip = saleData.tip || 0;
        this.total = saleData.total;
        this.paymentMethod = saleData.paymentMethod;
        this.paymentId = saleData.paymentId || null;
        this.orderType = saleData.orderType;
        this.saleDate = saleData.saleDate || new Date();
        this.shift = saleData.shift || this.determineShift();
        this.location = saleData.location || 'main-store';
        this.promotions = saleData.promotions || [];
        this.loyaltyPointsUsed = saleData.loyaltyPointsUsed || 0;
        this.loyaltyPointsEarned = saleData.loyaltyPointsEarned || 0;
        this.refunded = saleData.refunded || false;
        this.refundDate = saleData.refundDate || null;
        this.refundAmount = saleData.refundAmount || 0;
        this.refundReason = saleData.refundReason || null;
        this.notes = saleData.notes || '';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    determineShift() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    // Validation schema
    static getValidationSchema() {
        return {
            $jsonSchema: {
                bsonType: "object",
                required: ["orderId", "orderNumber", "customerId", "staffId", "items", "subtotal", "tax", "total", "paymentMethod", "orderType", "saleDate"],
                properties: {
                    orderId: {
                        bsonType: "objectId",
                        description: "Reference to the order"
                    },
                    orderNumber: {
                        bsonType: "string",
                        pattern: "^CF[0-9]{9}$",
                        description: "Order number"
                    },
                    customerId: {
                        bsonType: "objectId",
                        description: "Customer ID"
                    },
                    customerInfo: {
                        bsonType: "object",
                        required: ["name", "email"],
                        properties: {
                            name: { bsonType: "string" },
                            email: { bsonType: "string" },
                            phone: { bsonType: ["string", "null"] },
                            loyaltyMember: { bsonType: "bool" }
                        }
                    },
                    staffId: {
                        bsonType: "objectId",
                        description: "Staff member who processed the sale"
                    },
                    staffName: {
                        bsonType: "string",
                        description: "Staff member name"
                    },
                    items: {
                        bsonType: "array",
                        minItems: 1,
                        items: {
                            bsonType: "object",
                            required: ["productId", "name", "category", "quantity", "price", "total"],
                            properties: {
                                productId: { bsonType: "objectId" },
                                name: { bsonType: "string" },
                                category: { bsonType: "string" },
                                quantity: { bsonType: "int", minimum: 1 },
                                size: { bsonType: ["string", "null"] },
                                price: { bsonType: "double", minimum: 0 },
                                total: { bsonType: "double", minimum: 0 },
                                cost: { bsonType: ["double", "null"] },
                                profit: { bsonType: ["double", "null"] },
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
                                }
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
                    paymentId: {
                        bsonType: ["string", "null"],
                        description: "Payment transaction ID"
                    },
                    orderType: {
                        bsonType: "string",
                        enum: ["pickup", "delivery", "dine-in"],
                        description: "Order type"
                    },
                    saleDate: {
                        bsonType: "date",
                        description: "Sale date and time"
                    },
                    shift: {
                        bsonType: "string",
                        enum: ["morning", "afternoon", "evening", "night"],
                        description: "Shift when sale occurred"
                    },
                    location: {
                        bsonType: "string",
                        description: "Store location"
                    },
                    promotions: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["name", "type", "value"],
                            properties: {
                                name: { bsonType: "string" },
                                type: { 
                                    bsonType: "string",
                                    enum: ["percentage", "fixed-amount", "buy-one-get-one", "loyalty-discount"]
                                },
                                value: { bsonType: "double" },
                                description: { bsonType: ["string", "null"] }
                            }
                        }
                    },
                    loyaltyPointsUsed: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Loyalty points used"
                    },
                    loyaltyPointsEarned: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Loyalty points earned"
                    },
                    refunded: {
                        bsonType: "bool",
                        description: "Whether the sale was refunded"
                    },
                    refundDate: {
                        bsonType: ["date", "null"],
                        description: "Refund date if applicable"
                    },
                    refundAmount: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Refund amount"
                    },
                    refundReason: {
                        bsonType: ["string", "null"],
                        description: "Reason for refund"
                    },
                    notes: {
                        bsonType: "string",
                        maxLength: 500,
                        description: "Additional notes"
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "Record creation timestamp"
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
        await db.collection('sales').createIndexes([
            { key: { orderId: 1 }, unique: true },
            { key: { orderNumber: 1 } },
            { key: { customerId: 1 } },
            { key: { staffId: 1 } },
            { key: { saleDate: -1 } },
            { key: { shift: 1 } },
            { key: { location: 1 } },
            { key: { paymentMethod: 1 } },
            { key: { orderType: 1 } },
            { key: { refunded: 1 } },
            { key: { total: -1 } },
            { key: { "items.category": 1 } },
            { key: { "items.productId": 1 } },
            { key: { saleDate: 1, location: 1 } },
            { key: { saleDate: 1, staffId: 1 } }
        ]);
    }

    // Static methods for database operations
    static async findById(id) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('sales').findOne({ _id: new ObjectId(id) });
    }

    static async findByOrderId(orderId) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('sales').findOne({ orderId: new ObjectId(orderId) });
    }

    static async findByCustomerId(customerId) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('sales').find({ customerId: new ObjectId(customerId) })
            .sort({ saleDate: -1 }).toArray();
    }

    static async findByDateRange(startDate, endDate) {
        const db = getDB();
        return await db.collection('sales').find({
            saleDate: {
                $gte: startDate,
                $lte: endDate
            },
            refunded: false
        }).sort({ saleDate: -1 }).toArray();
    }

    static async getDailySales(date) {
        const db = getDB();
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        return await db.collection('sales').find({
            saleDate: {
                $gte: startDate,
                $lte: endDate
            },
            refunded: false
        }).toArray();
    }

    static async getSalesByStaff(staffId, startDate, endDate) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('sales').find({
            staffId: new ObjectId(staffId),
            saleDate: {
                $gte: startDate,
                $lte: endDate
            },
            refunded: false
        }).toArray();
    }

    static async getTopSellingProducts(startDate, endDate, limit = 10) {
        const db = getDB();
        return await db.collection('sales').aggregate([
            {
                $match: {
                    saleDate: { $gte: startDate, $lte: endDate },
                    refunded: false
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.name" },
                    category: { $first: "$items.category" },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.total" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        ]).toArray();
    }

    static async getSalesReport(startDate, endDate) {
        const db = getDB();
        return await db.collection('sales').aggregate([
            {
                $match: {
                    saleDate: { $gte: startDate, $lte: endDate },
                    refunded: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$total" },
                    totalTax: { $sum: "$tax" },
                    totalTips: { $sum: "$tip" },
                    totalDiscounts: { $sum: "$discount" },
                    averageOrderValue: { $avg: "$total" },
                    paymentMethods: {
                        $push: {
                            method: "$paymentMethod",
                            amount: "$total"
                        }
                    }
                }
            }
        ]).toArray();
    }

    static async getHourlySales(date) {
        const db = getDB();
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        return await db.collection('sales').aggregate([
            {
                $match: {
                    saleDate: { $gte: startDate, $lte: endDate },
                    refunded: false
                }
            },
            {
                $group: {
                    _id: { $hour: "$saleDate" },
                    salesCount: { $sum: 1 },
                    totalRevenue: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();
    }

    static async processRefund(saleId, refundAmount, reason) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        return await db.collection('sales').updateOne(
            { _id: new ObjectId(saleId) },
            {
                $set: {
                    refunded: true,
                    refundDate: new Date(),
                    refundAmount: refundAmount,
                    refundReason: reason,
                    updatedAt: new Date()
                }
            }
        );
    }

    // Instance methods
    async save() {
        const db = getDB();
        const result = await db.collection('sales').insertOne(this);
        return result;
    }

    async update(updates) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        updates.updatedAt = new Date();
        return await db.collection('sales').updateOne(
            { _id: new ObjectId(this._id) },
            { $set: updates }
        );
    }

    calculateProfit() {
        return this.items.reduce((total, item) => {
            if (item.cost) {
                return total + ((item.price - item.cost) * item.quantity);
            }
            return total;
        }, 0);
    }

    getItemsByCategory() {
        const categories = {};
        this.items.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });
        return categories;
    }
}

module.exports = Sale;
