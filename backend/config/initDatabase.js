const { connectDB, getDB } = require('./databaseMongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');

/**
 * Initialize the database with collections, validation schemas, and indexes
 */
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing Coffee Shop Database...');
        
        // Connect to database
        await connectDB();
        const db = getDB();
        
        // Create collections with validation schemas
        await createCollectionWithValidation(db, 'users', User.getValidationSchema());
        await createCollectionWithValidation(db, 'products', Product.getValidationSchema());
        await createCollectionWithValidation(db, 'orders', Order.getValidationSchema());
        await createCollectionWithValidation(db, 'inventory', Inventory.getValidationSchema());
        await createCollectionWithValidation(db, 'sales', Sale.getValidationSchema());
        
        // Create indexes for all collections
        console.log('📊 Creating database indexes...');
        await User.createIndexes();
        await Product.createIndexes();
        await Order.createIndexes();
        await Inventory.createIndexes();
        await Sale.createIndexes();
        
        // Skip sample data insertion for now
        // await insertSampleData(db);
        
        console.log('✅ Database initialization completed successfully!');
        console.log('📋 Collections created:');
        console.log('   - users (with role-based access)');
        console.log('   - products (coffee, food items with categories)');
        console.log('   - orders (order tracking and status)');
        console.log('   - inventory (stock management)');
        console.log('   - sales (transaction records for reporting)');
        console.log('⚠️  Sample data insertion skipped - you can add data manually or through the API');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Create a collection with validation schema
 */
async function createCollectionWithValidation(db, collectionName, validationSchema) {
    try {
        // Check if collection exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
            // Create collection with validation
            await db.createCollection(collectionName, {
                validator: validationSchema
            });
            console.log(`✅ Created collection: ${collectionName}`);
        } else {
            // Update validation schema for existing collection
            await db.command({
                collMod: collectionName,
                validator: validationSchema
            });
            console.log(`🔄 Updated validation schema for: ${collectionName}`);
        }
    } catch (error) {
        console.error(`❌ Error creating collection ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Insert sample data for testing and development
 */
async function insertSampleData(db) {
    try {
        console.log('🔄 Inserting sample data...');
        
        // Check if users collection is empty
        const userCount = await db.collection('users').countDocuments();
        if (userCount === 0) {
            await insertSampleUsers(db);
        }
        
        // Check if products collection is empty
        const productCount = await db.collection('products').countDocuments();
        if (productCount === 0) {
            await insertSampleProducts(db);
        }
        
        console.log('✅ Sample data inserted successfully!');
    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
        throw error;
    }
}

/**
 * Insert sample users
 */
async function insertSampleUsers(db) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    
    const sampleUsers = [
        {
            name: 'Admin User',
            email: 'admin@coffeeshop.com',
            password: await bcrypt.hash('admin123', saltRounds),
            role: 'admin',
            phone: '+1234567890',
            address: {
                street: '123 Coffee St',
                city: 'Brewtown',
                state: 'CA',
                zipCode: '90210',
                country: 'USA'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: 'Manager Smith',
            email: 'manager@coffeeshop.com',
            password: await bcrypt.hash('manager123', saltRounds),
            role: 'manager',
            phone: '+1234567891',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: 'Barista Jane',
            email: 'barista@coffeeshop.com',
            password: await bcrypt.hash('barista123', saltRounds),
            role: 'staff',
            phone: '+1234567892',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: 'John Customer',
            email: 'customer@example.com',
            password: await bcrypt.hash('customer123', saltRounds),
            role: 'customer',
            phone: '+1234567893',
            loyaltyPoints: 150,
            preferences: {
                favoriteProducts: [],
                dietaryRestrictions: ['dairy-free'],
                preferredSize: 'medium',
                notifications: {
                    email: true,
                    sms: false,
                    push: true
                }
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    await db.collection('users').insertMany(sampleUsers);
    console.log('✅ Sample users inserted');
}

/**
 * Insert sample products
 */
async function insertSampleProducts(db) {
    // Get admin user ID for createdBy field
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    const adminId = adminUser._id;
    
    const sampleProducts = [
        {
            name: 'Espresso',
            description: 'Rich and bold espresso shot',
            category: 'coffee',
            subcategory: 'espresso',
            price: { base: 2.50 },
            sizes: [
                { size: 'small', price: 2.50, calories: 5 },
                { size: 'medium', price: 3.00, calories: 10 }
            ],
            images: [
                { url: '/images/espresso.jpg', alt: 'Espresso shot', isPrimary: true }
            ],
            ingredients: ['espresso beans', 'water'],
            nutritionalInfo: {
                calories: 5,
                protein: 0.1,
                carbs: 0.8,
                fat: 0.2,
                caffeine: 64
            },
            isAvailable: true,
            isFeatured: true,
            preparationTime: 2,
            tags: ['coffee', 'strong', 'quick'],
            customizations: [
                {
                    name: 'Extra Shot',
                    type: 'extra-shot',
                    options: [
                        { name: 'Single Extra Shot', price: 0.75 },
                        { name: 'Double Extra Shot', price: 1.50 }
                    ]
                }
            ],
            createdBy: adminId,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: 'Cappuccino',
            description: 'Perfect balance of espresso, steamed milk, and foam',
            category: 'coffee',
            subcategory: 'milk-based',
            price: { base: 4.50 },
            sizes: [
                { size: 'small', price: 4.50, calories: 120 },
                { size: 'medium', price: 5.00, calories: 150 },
                { size: 'large', price: 5.50, calories: 180 }
            ],
            images: [
                { url: '/images/cappuccino.jpg', alt: 'Cappuccino with foam art', isPrimary: true }
            ],
            ingredients: ['espresso beans', 'milk', 'water'],
            nutritionalInfo: {
                calories: 120,
                protein: 6,
                carbs: 12,
                fat: 4,
                caffeine: 64
            },
            allergens: ['dairy'],
            isAvailable: true,
            isFeatured: true,
            preparationTime: 4,
            tags: ['coffee', 'milk', 'foam'],
            customizations: [
                {
                    name: 'Milk Type',
                    type: 'milk',
                    options: [
                        { name: 'Oat Milk', price: 0.60 },
                        { name: 'Almond Milk', price: 0.50 },
                        { name: 'Soy Milk', price: 0.50 },
                        { name: 'Coconut Milk', price: 0.60 }
                    ]
                },
                {
                    name: 'Syrup',
                    type: 'syrup',
                    options: [
                        { name: 'Vanilla', price: 0.50 },
                        { name: 'Caramel', price: 0.50 },
                        { name: 'Hazelnut', price: 0.50 }
                    ]
                }
            ],
            createdBy: adminId,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: 'Croissant',
            description: 'Buttery, flaky French pastry',
            category: 'pastries',
            subcategory: 'breakfast',
            price: { base: 3.25 },
            images: [
                { url: '/images/croissant.jpg', alt: 'Fresh croissant', isPrimary: true }
            ],
            ingredients: ['flour', 'butter', 'eggs', 'milk', 'sugar', 'salt', 'yeast'],
            nutritionalInfo: {
                calories: 231,
                protein: 4.7,
                carbs: 26,
                fat: 12,
                sugar: 3.2
            },
            allergens: ['gluten', 'dairy', 'eggs'],
            isAvailable: true,
            preparationTime: 1,
            tags: ['pastry', 'breakfast', 'french'],
            createdBy: adminId,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            name: 'Iced Coffee',
            description: 'Refreshing cold brew coffee over ice',
            category: 'cold-drinks',
            subcategory: 'coffee',
            price: { base: 3.75 },
            sizes: [
                { size: 'medium', price: 3.75, calories: 5 },
                { size: 'large', price: 4.25, calories: 10 }
            ],
            images: [
                { url: '/images/iced-coffee.jpg', alt: 'Iced coffee with ice cubes', isPrimary: true }
            ],
            ingredients: ['coffee beans', 'water', 'ice'],
            nutritionalInfo: {
                calories: 5,
                protein: 0.3,
                carbs: 1.2,
                fat: 0,
                caffeine: 95
            },
            isAvailable: true,
            preparationTime: 3,
            tags: ['cold', 'refreshing', 'coffee'],
            customizations: [
                {
                    name: 'Milk Type',
                    type: 'milk',
                    options: [
                        { name: 'Regular Milk', price: 0.50 },
                        { name: 'Oat Milk', price: 0.60 },
                        { name: 'Almond Milk', price: 0.50 }
                    ]
                },
                {
                    name: 'Sweetener',
                    type: 'sugar',
                    options: [
                        { name: 'Simple Syrup', price: 0.25 },
                        { name: 'Honey', price: 0.50 },
                        { name: 'Agave', price: 0.50 }
                    ]
                }
            ],
            createdBy: adminId,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    await db.collection('products').insertMany(sampleProducts);
    console.log('✅ Sample products inserted');
}

/**
 * Drop all collections (use with caution!)
 */
async function dropAllCollections() {
    try {
        console.log('🗑️  Dropping all collections...');
        const db = getDB();
        
        const collections = ['users', 'products', 'orders', 'inventory', 'sales'];
        
        for (const collectionName of collections) {
            try {
                await db.collection(collectionName).drop();
                console.log(`✅ Dropped collection: ${collectionName}`);
            } catch (error) {
                if (error.message.includes('ns not found')) {
                    console.log(`⚠️  Collection ${collectionName} does not exist`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ All collections dropped successfully!');
    } catch (error) {
        console.error('❌ Error dropping collections:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    initializeDatabase,
    dropAllCollections,
    insertSampleData
};

// Run initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('🎉 Database setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database setup failed:', error);
            process.exit(1);
        });
}
