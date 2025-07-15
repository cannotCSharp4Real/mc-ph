const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function createAdminUser() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('coffee-shop');
        
        // Check if admin user already exists
        const existingAdmin = await db.collection('users').findOne({ email: 'admin@mcph.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Create admin user
        const adminUser = {
            name: 'Admin User',
            email: 'admin@mcph.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('users').insertOne(adminUser);
        console.log('Admin user created successfully!');
        console.log('Email: admin@mcph.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await client.close();
    }
}

createAdminUser();
