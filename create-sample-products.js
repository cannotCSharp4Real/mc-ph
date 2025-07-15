const { MongoClient } = require('mongodb');

async function createSampleProducts() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('coffee-shop');
        
        // Sample products - using simplified structure that matches our admin interface
        const sampleProducts = [
            // Drinks
            {
                name: 'Americano',
                description: 'Rich, bold coffee made with espresso and hot water',
                category: 'drinks',
                sizes: [
                    { name: 'Small', price: 69 },
                    { name: 'Medium', price: 79 },
                    { name: 'Large', price: 89 }
                ],
                inStock: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Spanish Latte',
                description: 'Creamy latte with condensed milk and steamed milk',
                category: 'drinks',
                sizes: [
                    { name: 'Small', price: 89 },
                    { name: 'Medium', price: 99 },
                    { name: 'Large', price: 109 }
                ],
                inStock: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            
            // Food
            {
                name: 'Peanut Butter Crunch',
                description: 'Crunchy sandwich with peanut butter and local ingredients',
                category: 'food',
                price: 130,
                inStock: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            
            // Add-ons
            {
                name: 'Espresso Shot',
                description: 'Extra shot of espresso',
                category: 'add-ons',
                price: 30,
                inStock: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        // Drop the products collection to remove any validation rules
        await db.collection('products').drop().catch(() => {
            console.log('Products collection does not exist, creating new one');
        });
        
        // Insert sample products
        await db.collection('products').insertMany(sampleProducts);
        
        console.log('Sample products created successfully!');
        console.log(`Created ${sampleProducts.length} products`);
        
    } catch (error) {
        console.error('Error creating sample products:', error);
    } finally {
        await client.close();
    }
}

createSampleProducts();
