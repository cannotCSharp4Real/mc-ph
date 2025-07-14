const { getDB } = require('../config/database');

class Product {
    constructor(productData) {
        this.name = productData.name;
        this.description = productData.description;
        this.category = productData.category;
        this.subcategory = productData.subcategory || null;
        this.price = productData.price;
        this.sizes = productData.sizes || [];
        this.images = productData.images || [];
        this.ingredients = productData.ingredients || [];
        this.nutritionalInfo = productData.nutritionalInfo || {};
        this.allergens = productData.allergens || [];
        this.isAvailable = productData.isAvailable !== undefined ? productData.isAvailable : true;
        this.isFeatured = productData.isFeatured || false;
        this.preparationTime = productData.preparationTime || 5; // in minutes
        this.tags = productData.tags || [];
        this.customizations = productData.customizations || [];
        this.seasonalItem = productData.seasonalItem || false;
        this.seasonalDates = productData.seasonalDates || null;
        this.createdBy = productData.createdBy; // User ID
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Validation schema
    static getValidationSchema() {
        return {
            $jsonSchema: {
                bsonType: "object",
                required: ["name", "description", "category", "price", "createdBy"],
                properties: {
                    name: {
                        bsonType: "string",
                        minLength: 2,
                        maxLength: 100,
                        description: "Product name must be 2-100 characters"
                    },
                    description: {
                        bsonType: "string",
                        maxLength: 500,
                        description: "Product description"
                    },
                    category: {
                        bsonType: "string",
                        enum: ["coffee", "tea", "cold-drinks", "hot-drinks", "pastries", "sandwiches", "salads", "desserts", "merchandise"],
                        description: "Product category"
                    },
                    subcategory: {
                        bsonType: ["string", "null"],
                        description: "Product subcategory"
                    },
                    price: {
                        bsonType: "object",
                        required: ["base"],
                        properties: {
                            base: {
                                bsonType: "double",
                                minimum: 0,
                                description: "Base price for the product"
                            },
                            small: { bsonType: ["double", "null"] },
                            medium: { bsonType: ["double", "null"] },
                            large: { bsonType: ["double", "null"] },
                            extraLarge: { bsonType: ["double", "null"] }
                        }
                    },
                    sizes: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["size", "price"],
                            properties: {
                                size: {
                                    bsonType: "string",
                                    enum: ["small", "medium", "large", "extra-large"]
                                },
                                price: {
                                    bsonType: "double",
                                    minimum: 0
                                },
                                calories: { bsonType: ["int", "null"] }
                            }
                        }
                    },
                    images: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["url", "alt"],
                            properties: {
                                url: { bsonType: "string" },
                                alt: { bsonType: "string" },
                                isPrimary: { bsonType: "bool" }
                            }
                        }
                    },
                    ingredients: {
                        bsonType: "array",
                        items: { bsonType: "string" }
                    },
                    nutritionalInfo: {
                        bsonType: "object",
                        properties: {
                            calories: { bsonType: ["int", "null"] },
                            protein: { bsonType: ["double", "null"] },
                            carbs: { bsonType: ["double", "null"] },
                            fat: { bsonType: ["double", "null"] },
                            sugar: { bsonType: ["double", "null"] },
                            sodium: { bsonType: ["double", "null"] },
                            caffeine: { bsonType: ["double", "null"] }
                        }
                    },
                    allergens: {
                        bsonType: "array",
                        items: {
                            bsonType: "string",
                            enum: ["dairy", "nuts", "gluten", "soy", "eggs", "shellfish", "sesame"]
                        }
                    },
                    isAvailable: {
                        bsonType: "bool",
                        description: "Product availability status"
                    },
                    isFeatured: {
                        bsonType: "bool",
                        description: "Whether product is featured"
                    },
                    preparationTime: {
                        bsonType: "int",
                        minimum: 1,
                        description: "Preparation time in minutes"
                    },
                    tags: {
                        bsonType: "array",
                        items: { bsonType: "string" }
                    },
                    customizations: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["name", "type"],
                            properties: {
                                name: { bsonType: "string" },
                                type: {
                                    bsonType: "string",
                                    enum: ["milk", "syrup", "extra-shot", "sugar", "temperature", "other"]
                                },
                                options: {
                                    bsonType: "array",
                                    items: {
                                        bsonType: "object",
                                        required: ["name", "price"],
                                        properties: {
                                            name: { bsonType: "string" },
                                            price: { bsonType: "double" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    seasonalItem: {
                        bsonType: "bool",
                        description: "Whether this is a seasonal item"
                    },
                    seasonalDates: {
                        bsonType: ["object", "null"],
                        properties: {
                            startDate: { bsonType: "date" },
                            endDate: { bsonType: "date" }
                        }
                    },
                    createdBy: {
                        bsonType: "objectId",
                        description: "User ID who created the product"
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "Product creation timestamp"
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
        await db.collection('products').createIndexes([
            { key: { name: 1 } },
            { key: { category: 1 } },
            { key: { subcategory: 1 } },
            { key: { isAvailable: 1 } },
            { key: { isFeatured: 1 } },
            { key: { tags: 1 } },
            { key: { "price.base": 1 } },
            { key: { createdAt: -1 } },
            { key: { name: "text", description: "text", tags: "text" } }
        ]);
    }

    // Static methods for database operations
    static async findById(id) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('products').findOne({ _id: new ObjectId(id) });
    }

    static async findByCategory(category) {
        const db = getDB();
        return await db.collection('products').find({ category, isAvailable: true }).toArray();
    }

    static async findFeatured() {
        const db = getDB();
        return await db.collection('products').find({ isFeatured: true, isAvailable: true }).toArray();
    }

    static async searchProducts(query) {
        const db = getDB();
        return await db.collection('products').find({
            $text: { $search: query },
            isAvailable: true
        }).toArray();
    }

    static async findAvailable() {
        const db = getDB();
        return await db.collection('products').find({ isAvailable: true }).toArray();
    }

    static async updateAvailability(productId, isAvailable) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('products').updateOne(
            { _id: new ObjectId(productId) },
            { 
                $set: { 
                    isAvailable,
                    updatedAt: new Date()
                }
            }
        );
    }

    // Instance methods
    async save() {
        const db = getDB();
        const result = await db.collection('products').insertOne(this);
        return result;
    }

    async update(updates) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        updates.updatedAt = new Date();
        return await db.collection('products').updateOne(
            { _id: new ObjectId(this._id) },
            { $set: updates }
        );
    }
}

module.exports = Product;
