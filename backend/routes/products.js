const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const products = await db.collection('products').find({}).toArray();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
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
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { name, description, price, category, image, inStock } = req.body;
        
        const newProduct = {
            name,
            description,
            price: parseFloat(price),
            category,
            image,
            inStock: inStock !== undefined ? inStock : true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('products').insertOne(newProduct);
        res.status(201).json({ ...newProduct, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { ObjectId } = require('mongodb');
        const { name, description, price, category, image, inStock } = req.body;
        
        const updateData = {
            name,
            description,
            price: parseFloat(price),
            category,
            image,
            inStock,
            updatedAt: new Date()
        };
        
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
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
router.delete('/:id', async (req, res) => {
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
