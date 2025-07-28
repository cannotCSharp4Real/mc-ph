const { getDB } = require('../config/databaseMongoose');

class User {
    constructor(userData) {
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.role = userData.role || 'customer';
        this.phone = userData.phone || null;
        this.address = userData.address || null;
        this.dateOfBirth = userData.dateOfBirth || null;
        this.preferences = userData.preferences || {};
        this.loyaltyPoints = userData.loyaltyPoints || 0;
        this.isActive = userData.isActive !== undefined ? userData.isActive : true;
        this.lastLogin = userData.lastLogin || null;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Validation schema
    static getValidationSchema() {
        return {
            $jsonSchema: {
                bsonType: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                    name: {
                        bsonType: "string",
                        minLength: 2,
                        maxLength: 100,
                        description: "Name must be a string between 2-100 characters"
                    },
                    email: {
                        bsonType: "string",
                        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                        description: "Must be a valid email address"
                    },
                    password: {
                        bsonType: "string",
                        minLength: 60,
                        maxLength: 60,
                        description: "Must be a bcrypt hashed password"
                    },
                    role: {
                        bsonType: "string",
                        enum: ["customer", "staff", "manager", "admin"],
                        description: "Role must be one of: customer, staff, manager, admin"
                    },
                    phone: {
                        bsonType: ["string", "null"],
                        pattern: "^\\+?[1-9]\\d{1,14}$",
                        description: "Must be a valid phone number"
                    },
                    address: {
                        bsonType: ["object", "null"],
                        properties: {
                            street: { bsonType: "string" },
                            city: { bsonType: "string" },
                            state: { bsonType: "string" },
                            zipCode: { bsonType: "string" },
                            country: { bsonType: "string" }
                        }
                    },
                    dateOfBirth: {
                        bsonType: ["date", "null"],
                        description: "Date of birth"
                    },
                    preferences: {
                        bsonType: "object",
                        properties: {
                            favoriteProducts: {
                                bsonType: "array",
                                items: { bsonType: "objectId" }
                            },
                            dietaryRestrictions: {
                                bsonType: "array",
                                items: { 
                                    bsonType: "string",
                                    enum: ["dairy-free", "sugar-free", "gluten-free", "vegan", "keto", "organic"]
                                }
                            },
                            preferredSize: {
                                bsonType: "string",
                                enum: ["small", "medium", "large", "extra-large"]
                            },                                notifications: {
                                    bsonType: "object",
                                    properties: {
                                        email: { bsonType: "bool" },
                                        sms: { bsonType: "bool" },
                                        push: { bsonType: "bool" }
                                    }
                                }
                        }
                    },
                    loyaltyPoints: {
                        bsonType: "int",
                        minimum: 0,
                        description: "Loyalty points earned by customer"
                    },
                    isActive: {
                        bsonType: "bool",
                        description: "Whether the user account is active"
                    },
                    lastLogin: {
                        bsonType: ["date", "null"],
                        description: "Last login timestamp"
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "Account creation timestamp"
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
        await db.collection('users').createIndexes([
            { key: { email: 1 }, unique: true },
            { key: { role: 1 } },
            { key: { phone: 1 }, sparse: true },
            { key: { isActive: 1 } },
            { key: { createdAt: -1 } },
            { key: { loyaltyPoints: -1 } }
        ]);
    }

    // Static methods for database operations
    static async findById(id) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('users').findOne({ _id: new ObjectId(id) });
    }

    static async findByEmail(email) {
        const db = getDB();
        return await db.collection('users').findOne({ email });
    }

    static async findByRole(role) {
        const db = getDB();
        return await db.collection('users').find({ role }).toArray();
    }

    static async updateLastLogin(userId) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { lastLogin: new Date(), updatedAt: new Date() } }
        );
    }

    static async updateLoyaltyPoints(userId, points) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        return await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { 
                $inc: { loyaltyPoints: points },
                $set: { updatedAt: new Date() }
            }
        );
    }

    // Instance methods
    async save() {
        const db = getDB();
        const result = await db.collection('users').insertOne(this);
        return result;
    }

    async update(updates) {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        updates.updatedAt = new Date();
        return await db.collection('users').updateOne(
            { _id: new ObjectId(this._id) },
            { $set: updates }
        );
    }
}

module.exports = User;
