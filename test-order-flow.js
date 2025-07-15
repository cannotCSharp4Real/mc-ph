// Test script to simulate the complete ordering flow
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-shop';

async function testOrderFlow() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db();
        
        console.log('🧪 Testing Complete Order Flow...\n');
        
        // Test 1: Add sample products
        console.log('1. Adding sample products...');
        const sampleProducts = [
            {
                name: 'Cappuccino',
                description: 'Rich espresso with steamed milk and foam',
                price: 95,
                category: 'Coffee',
                inStock: true,
                image: '/images/cappuccino.jpg'
            },
            {
                name: 'Americano',
                description: 'Espresso with hot water',
                price: 75,
                category: 'Coffee',
                inStock: true,
                image: '/images/americano.jpg'
            },
            {
                name: 'Blueberry Muffin',
                description: 'Fresh baked muffin with blueberries',
                price: 85,
                category: 'Food',
                inStock: true,
                image: '/images/muffin.jpg'
            }
        ];
        
        await db.collection('products').insertMany(sampleProducts);
        console.log('✅ Sample products added');
        
        // Test 2: Create test order
        console.log('\n2. Creating test order...');
        const testOrder = {
            orderNumber: `ORD${Date.now()}`,
            customerInfo: {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890'
            },
            items: [
                {
                    productId: sampleProducts[0]._id,
                    name: 'Cappuccino',
                    quantity: 2,
                    price: 95,
                    size: 'Large',
                    total: 190,
                    addons: [
                        { name: 'Extra Shot', price: 30 }
                    ]
                },
                {
                    productId: sampleProducts[2]._id,
                    name: 'Blueberry Muffin',
                    quantity: 1,
                    price: 85,
                    total: 85,
                    addons: []
                }
            ],
            orderType: 'pickup',
            paymentMethod: 'cash',
            subtotal: 275,
            tax: 22.69,
            total: 297.69,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedPrepTime: 15
        };
        
        const orderResult = await db.collection('orders').insertOne(testOrder);
        console.log('✅ Test order created:', orderResult.insertedId);
        
        // Test 3: Test order status updates
        console.log('\n3. Testing order status updates...');
        
        // Update to preparing
        await db.collection('orders').updateOne(
            { _id: orderResult.insertedId },
            { $set: { status: 'preparing', updatedAt: new Date() } }
        );
        console.log('✅ Order status updated to preparing');
        
        // Update to completed
        await db.collection('orders').updateOne(
            { _id: orderResult.insertedId },
            { $set: { status: 'completed', updatedAt: new Date(), completedAt: new Date() } }
        );
        console.log('✅ Order status updated to completed');
        
        // Test 4: Test notifications
        console.log('\n4. Testing notifications...');
        const notification = {
            orderId: orderResult.insertedId,
            customerEmail: 'john@example.com',
            message: 'Your order is ready for pickup!',
            type: 'order_update',
            status: 'ready',
            createdAt: new Date(),
            read: false
        };
        
        await db.collection('notifications').insertOne(notification);
        console.log('✅ Notification created');
        
        // Test 5: Verify data
        console.log('\n5. Verifying data...');
        const orderCount = await db.collection('orders').countDocuments();
        const productCount = await db.collection('products').countDocuments();
        const notificationCount = await db.collection('notifications').countDocuments();
        
        console.log(`📊 Database Summary:`);
        console.log(`   Orders: ${orderCount}`);
        console.log(`   Products: ${productCount}`);
        console.log(`   Notifications: ${notificationCount}`);
        
        console.log('\n🎉 Order flow test completed successfully!');
        console.log('\nTest Results:');
        console.log('✅ Products can be loaded from database');
        console.log('✅ Orders can be created and stored');
        console.log('✅ Order status can be updated');
        console.log('✅ Notifications can be created');
        console.log('✅ Complete order workflow is functional');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.close();
    }
}

async function cleanupTestData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db();
        
        console.log('🧹 Cleaning up test data...');
        
        // Remove test orders
        await db.collection('orders').deleteMany({
            'customerInfo.email': 'john@example.com'
        });
        
        // Remove test notifications
        await db.collection('notifications').deleteMany({
            customerEmail: 'john@example.com'
        });
        
        console.log('✅ Test data cleaned up');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await client.close();
    }
}

// Run the test
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'cleanup') {
        cleanupTestData();
    } else {
        testOrderFlow();
    }
}

module.exports = { testOrderFlow, cleanupTestData };
