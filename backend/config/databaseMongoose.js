const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('📊 Using existing MongoDB connection');
        return;
    }

    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-shop';
        
        console.log('🔄 Connecting to MongoDB with Mongoose...');
        console.log('URI:', mongoURI.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
        
        // Mongoose connection options
        const options = {
            serverApi: { version: '1', strict: true, deprecationErrors: true }
        };

        await mongoose.connect(mongoURI, options);
        
        // Test the connection
        await mongoose.connection.db.admin().command({ ping: 1 });
        
        isConnected = true;
        
        console.log('✅ MongoDB connected successfully with Mongoose');
        console.log('📊 Database name:', mongoose.connection.db.databaseName);
        console.log('🏓 MongoDB ping successful');
        
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

const getDB = () => {
    if (!isConnected || !mongoose.connection.db) {
        console.warn('⚠️  Database not initialized. Some features may not work properly.');
        return null;
    }
    return mongoose.connection.db;
};

const closeDB = async () => {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('🔌 MongoDB connection closed');
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
    isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await closeDB();
    process.exit(0);
});

module.exports = { connectDB, getDB, closeDB };
