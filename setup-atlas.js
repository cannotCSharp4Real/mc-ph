// MongoDB Atlas Setup Script
// Run this after connecting to Atlas to set up initial data

const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB } = require('./backend/config/databaseMongoose');

// Import your models
const Product = require('./backend/models/Product');
const User = require('./backend/models/User');

async function setupAtlasDatabase() {
    try {
        console.log('🚀 Setting up MongoDB Atlas database...');
        
        // Connect to Atlas
        await connectDB();
        
        // Clear existing data (optional - remove if you want to keep existing data)
        console.log('🗑️  Clearing existing data...');
        await Product.deleteMany({});
        await User.deleteMany({});
        
        // Create sample products
        console.log('☕ Creating sample products...');
        const sampleProducts = [
            {
                name: "Espresso",
                price: 85,
                category: "Coffee",
                description: "Rich and bold espresso shot",
                available: true
            },
            {
                name: "Cappuccino",
                price: 115,
                category: "Coffee",
                description: "Perfect blend of espresso and steamed milk",
                available: true
            },
            {
                name: "Latte",
                price: 125,
                category: "Coffee",
                description: "Smooth espresso with steamed milk and foam",
                available: true
            },
            {
                name: "Americano",
                price: 95,
                category: "Coffee",
                description: "Espresso with hot water",
                available: true
            },
            {
                name: "Chocolate Chip Cookie",
                price: 45,
                category: "Pastry",
                description: "Freshly baked chocolate chip cookie",
                available: true
            }
        ];
        
        await Product.insertMany(sampleProducts);
        console.log(`✅ Created ${sampleProducts.length} sample products`);
        
        // Create admin user (optional)
        console.log('👤 Creating admin user...');
        const adminUser = new User({
            name: "Admin User",
            email: "admin@mcph.com",
            password: "admin123", // Will be hashed by the model
            role: "admin"
        });
        
        await adminUser.save();
        console.log('✅ Created admin user');
        
        console.log('🎉 Database setup complete!');
        console.log('📊 Database name:', mongoose.connection.db.databaseName);
        
        // Close connection
        await mongoose.connection.close();
        console.log('📴 Connection closed');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupAtlasDatabase();
}

module.exports = { setupAtlasDatabase };
