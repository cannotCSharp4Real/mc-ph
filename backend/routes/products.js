const express = require('express');
const router = express.Router();
const { getDB } = require('../config/databaseMongoose');
const jwt = require('jsonwebtoken');

// Middleware for JWT token verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware for admin role verification
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        console.log('📡 GET /api/products - Fetching all products');
        const db = getDB();
        const { category } = req.query;
        
        let filter = {};
        if (category) {
            filter.category = category;
        }
        
        const products = await db.collection('products').find(filter).toArray();
        console.log(`✅ Found ${products.length} products`);
        res.json(products);
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// POST /api/products - Create new product (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const { name, description, category, inStock, price, sizes } = req.body;
        
        console.log('Creating product with data:', req.body);
        
        // Validate required fields
        if (!name || !category) {
            console.log('Validation failed: Name and category are required');
            return res.status(400).json({ message: 'Name and category are required' });
        }
        
        // Validate category-specific fields
        if (category === 'drinks' && (!sizes || sizes.length === 0)) {
            console.log('Validation failed: Drinks must have at least one size');
            return res.status(400).json({ message: 'Drinks must have at least one size' });
        }
        
        if ((category === 'food' || category === 'add-ons') && !price) {
            console.log('Validation failed: Price is required for food and add-ons. Price value:', price);
            return res.status(400).json({ message: 'Price is required for food and add-ons' });
        }
        
        const newProduct = {
            name,
            description: description || '',
            category,
            inStock: inStock !== undefined ? inStock : true,
            createdBy: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Add category-specific fields
        if (category === 'drinks') {
            newProduct.sizes = sizes;
        } else {
            newProduct.price = parseFloat(price);
        }
        
        console.log('Final product object:', newProduct);
        
        const result = await db.collection('products').insertOne(newProduct);
        res.status(201).json({ ...newProduct, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const { name, description, category, inStock, price, sizes } = req.body;
        
        // Validate required fields
        if (!name || !category) {
            return res.status(400).json({ message: 'Name and category are required' });
        }
        
        const updateData = {
            name,
            description: description || '',
            category,
            inStock: inStock !== undefined ? inStock : true,
            updatedBy: req.user.id,
            updatedAt: new Date()
        };
        
        let updateOperation = { $set: updateData };
        
        // Add category-specific fields
        if (category === 'drinks') {
            updateData.sizes = sizes;
            // Remove price field if it exists
            updateOperation.$unset = { price: "" };
        } else {
            updateData.price = parseFloat(price);
            // Remove sizes field if it exists
            updateOperation.$unset = { sizes: "" };
        }
        
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            updateOperation
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        
        const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

module.exports = router;
