const mongoose = require('mongoose');
require('dotenv').config();

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number },
    category: { type: String, required: true },
    pricing: {
        small: { type: Number },
        medium: { type: Number },
        large: { type: Number }
    },
    temperature: [{ type: String }],
    size: { type: String },
    image: { type: String, default: '' },
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
    {
        name: "Americano",
        description: "Rich espresso with hot water",
        category: "espresso",
        pricing: {
            small: 69,
            medium: 79,
            large: 99
        },
        temperature: ["hot", "iced"],
        inStock: true,
        image: ""
    },
    {
        name: "Speculoos",
        description: "Creamy milkshake with speculoos flavor",
        category: "milkshake",
        pricing: {
            small: 69,
            medium: 79,
            large: 99
        },
        inStock: true,
        image: ""
    },
    {
        name: "Peanut Butter Crunch",
        description: "Delicious sandwich with peanut butter",
        category: "sandwich",
        price: 130,
        size: "130g",
        inStock: true,
        image: ""
    },
    {
        name: "Plain Chocolate",
        description: "Belgian waffle with chocolate",
        category: "waffle",
        price: 140,
        size: "140g",
        inStock: true,
        image: ""
    },
    {
        name: "Espresso Shot",
        description: "Extra shot of espresso",
        category: "addon",
        price: 30,
        inStock: true,
        image: ""
    }
];

async function addSampleProducts() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://renaissanceibarragiron:1234@database.ifhp7xt.mongodb.net/';
        
        await mongoose.connect(mongoURI, {
            serverApi: { version: '1', strict: true, deprecationErrors: true }
        });
        
        console.log('Connected to MongoDB with Mongoose');
        
        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');
        
        // Add sample products
        const result = await Product.insertMany(sampleProducts);
        console.log(`Added ${result.length} sample products`);
        
        console.log('Sample products added successfully!');
        
    } catch (error) {
        console.error('Error adding sample products:', error);
    } finally {
        await mongoose.connection.close();
    }
}

addSampleProducts();
