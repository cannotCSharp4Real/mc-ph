const { getDB } = require('../config/database');

class Inventory {
    constructor(inventoryData) {
        this.productId = inventoryData.productId;
        this.productName = inventoryData.productName;
        this.category = inventoryData.category;
        this.currentStock = inventoryData.currentStock;
        this.minimumStock = inventoryData.minimumStock || 10;
        this.maximumStock = inventoryData.maximumStock || 1000;
        this.reorderLevel = inventoryData.reorderLevel || 20;
        this.reorderQuantity = inventoryData.reorderQuantity || 100;
        this.unit = inventoryData.unit || 'pieces'; // pieces, kg, lbs, oz, ml, l
        this.costPerUnit = inventoryData.costPerUnit;
        this.totalValue = inventoryData.totalValue || (this.currentStock * this.costPerUnit);
        this.supplierId = inventoryData.supplierId || null;
        this.supplierName = inventoryData.supplierName || null;
        this.lastRestocked = inventoryData.lastRestocked || null;
        this.expirationDate = inventoryData.expirationDate || null;
        this.batchNumber = inventoryData.batchNumber || null;
        this.location = inventoryData.location || 'main-storage';
        this.isActive = inventoryData.isActive !== undefined ? inventoryData.isActive : true;
        this.lowStockAlerts = inventoryData.lowStockAlerts !== undefined ? inventoryData.lowStockAlerts : true;
        this.createdBy = inventoryData.createdBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Validation schema
    static getValidationSchema() {
        return {
            $jsonSchema: {
                bsonType: "object",
                required: ["productId", "productName", "category", "currentStock", "minimumStock", "unit", "costPerUnit", "createdBy"],
                properties: {
                    productId: {
                        bsonType: "objectId",
                        description: "Reference to product"
                    },
                    productName: {
                        bsonType: "string",
                        minLength: 2,
                        maxLength: 100,
                        description: "Product name for easy reference"
                    },
                    category: {
                        bsonType: "string",
                        enum: ["raw-materials", "finished-products", "packaging", "supplies", "equipment"],
                        description: "Inventory category"
                    },
                    currentStock: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Current stock quantity"
                    },
                    minimumStock: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Minimum stock level"
                    },
                    maximumStock: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Maximum stock level"
                    },
                    reorderLevel: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Stock level at which to reorder"
                    },
                    reorderQuantity: {
                        bsonType: "int",
                        minimum: 1,
                        description: "Quantity to reorder"
                    },
                    unit: {
                        bsonType: "string",
                        enum: ["pieces", "kg", "lbs", "oz", "ml", "l", "boxes", "bags", "cups"],
                        description: "Unit of measurement"
                    },
                    costPerUnit: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Cost per unit"
                    },
                    totalValue: {
                        bsonType: "double",
                        minimum: 0,
                        description: "Total value of current stock"
                    },
                    supplierId: {
                        bsonType: ["objectId", "null"],
                        description: "Supplier ID reference"
                    },
                    supplierName: {
                        bsonType: ["string", "null"],
                        description: "Supplier name"
                    },
                    lastRestocked: {
                        bsonType: ["date", "null"],
                        description: "Last restock date"
                    },
                    expirationDate: {
                        bsonType: ["date", "null"],
                        description: "Expiration date for perishable items"
                    },
                    batchNumber: {
                        bsonType: ["string", "null"],
                        description: "Batch number for tracking"
                    },
                    location: {
                        bsonType: "string",
                        enum: ["main-storage", "freezer", "refrigerator", "dry-storage", "bar-area", "kitchen"],
                        description: "Storage location"
                    },
                    isActive: {
                        bsonType: "bool",
                        description: "Whether inventory item is active"
                    },
                    lowStockAlerts: {
                        bsonType: "bool",
                        description: "Whether to send low stock alerts"
                    },
                    createdBy: {
                        bsonType: "objectId",
                        description: "User ID who created the inventory entry"
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "Creation timestamp"
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
        await db.collection('inventory').createIndexes([
            { key: { productId: 1 }, unique: true },
            { key: { category: 1 } },
            { key: { currentStock: 1 } },
            { key: { minimumStock: 1 } },
            { key: { reorderLevel: 1 } },
            { key: { location: 1 } },
            { key: { isActive: 1 } },
            { key: { expirationDate: 1 }, sparse: true },
            { key: { lastRestocked: -1 } },
            { key: { supplierId: 1 }, sparse: true }
        ]);
    }

    // Static methods for database operations
    static async findById(id) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('inventory').findOne({ _id: new ObjectId(id) });
    }

    static async findByProductId(productId) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('inventory').findOne({ productId: new ObjectId(productId) });
    }

    static async findByCategory(category) {
        const db = getDB();
        return await db.collection('inventory').find({ category, isActive: true }).toArray();
    }

    static async findLowStock() {
        const db = getDB();
        return await db.collection('inventory').find({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true,
            lowStockAlerts: true
        }).toArray();
    }

    static async findExpiringSoon(days = 7) {
        const db = getDB();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        return await db.collection('inventory').find({
            expirationDate: {
                $lte: futureDate,
                $gte: new Date()
            },
            isActive: true
        }).toArray();
    }

    static async findByLocation(location) {
        const db = getDB();
        return await db.collection('inventory').find({ location, isActive: true }).toArray();
    }

    static async getTotalInventoryValue() {
        const db = getDB();
        const result = await db.collection('inventory').aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, totalValue: { $sum: "$totalValue" } } }
        ]).toArray();
        
        return result.length > 0 ? result[0].totalValue : 0;
    }

    static async updateStock(productId, quantity, operation = 'add') {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        const updateOperation = operation === 'add' 
            ? { $inc: { currentStock: quantity } }
            : { $inc: { currentStock: -quantity } };
        
        const result = await db.collection('inventory').updateOne(
            { productId: new ObjectId(productId) },
            {
                ...updateOperation,
                $set: { 
                    updatedAt: new Date(),
                    totalValue: { $multiply: ["$currentStock", "$costPerUnit"] }
                }
            }
        );
        
        // Check if stock is now below minimum
        const item = await this.findByProductId(productId);
        if (item && item.currentStock <= item.minimumStock) {
            // Could trigger notification here
            console.log(`Low stock alert: ${item.productName} is below minimum stock level`);
        }
        
        return result;
    }

    static async restockItem(productId, quantity, batchNumber = null) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        const updateData = {
            $inc: { currentStock: quantity },
            $set: {
                lastRestocked: new Date(),
                updatedAt: new Date()
            }
        };
        
        if (batchNumber) {
            updateData.$set.batchNumber = batchNumber;
        }
        
        const result = await db.collection('inventory').updateOne(
            { productId: new ObjectId(productId) },
            updateData
        );
        
        // Recalculate total value
        await db.collection('inventory').updateOne(
            { productId: new ObjectId(productId) },
            [{ $set: { totalValue: { $multiply: ["$currentStock", "$costPerUnit"] } } }]
        );
        
        return result;
    }

    // Instance methods
    async save() {
        const db = getDB();
        const result = await db.collection('inventory').insertOne(this);
        return result;
    }

    async update(updates) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        updates.updatedAt = new Date();
        
        // Recalculate total value if stock or cost changed
        if (updates.currentStock !== undefined || updates.costPerUnit !== undefined) {
            const currentStock = updates.currentStock !== undefined ? updates.currentStock : this.currentStock;
            const costPerUnit = updates.costPerUnit !== undefined ? updates.costPerUnit : this.costPerUnit;
            updates.totalValue = currentStock * costPerUnit;
        }
        
        return await db.collection('inventory').updateOne(
            { _id: new ObjectId(this._id) },
            { $set: updates }
        );
    }

    isLowStock() {
        return this.currentStock <= this.reorderLevel;
    }

    isExpiringSoon(days = 7) {
        if (!this.expirationDate) return false;
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + days);
        return this.expirationDate <= warningDate;
    }

    calculateTotalValue() {
        return this.currentStock * this.costPerUnit;
    }
}

module.exports = Inventory;
