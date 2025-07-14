const { MongoClient } = require('mongodb');

let db;
let client;

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-shop';
        
        console.log('🔄 Connecting to MongoDB...');
        console.log('URI:', mongoURI.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        client = new MongoClient(mongoURI);

        await client.connect();
        db = client.db();
        
        console.log('✅ MongoDB connected successfully');
        console.log('📊 Database name:', db.databaseName);
        
        // Test the connection
        await db.admin().ping();
        console.log('🏓 MongoDB ping successful');
        
        // Create indexes for better performance
        await createIndexes();
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('💡 Possible solutions:');
        console.error('   1. Check if MongoDB Atlas credentials are correct');
        console.error('   2. Verify IP whitelist in MongoDB Atlas');
        console.error('   3. Check if the database user has proper permissions');
        console.error('   4. Ensure the connection string is properly formatted');
        
        // Don't exit in development, just log the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

const createIndexes = async () => {
    try {
        // Create indexes for products collection
        await db.collection('products').createIndex({ name: 1 });
        await db.collection('products').createIndex({ category: 1 });
        await db.collection('products').createIndex({ price: 1 });
        
        // Create indexes for orders collection
        await db.collection('orders').createIndex({ userId: 1 });
        await db.collection('orders').createIndex({ orderDate: -1 });
        await db.collection('orders').createIndex({ status: 1 });
        
        // Create indexes for users collection
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
};

const getDB = () => {
    if (!db) {
        console.warn('⚠️  Database not initialized. Some features may not work properly.');
        return null;
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
};

module.exports = { connectDB, getDB, closeDB };
