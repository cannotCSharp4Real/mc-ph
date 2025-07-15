const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

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
    quantity: { type: Number, default: 100 }, // Add quantity tracking
    lowStockThreshold: { type: Number, default: 10 }, // Low stock warning threshold
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// POST /api/products/check-inventory - Check inventory for multiple products
router.post('/check-inventory', async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid items data' 
            });
        }
        
        const inventoryChecks = await Promise.all(
            items.map(async (item) => {
                try {
                    const product = await Product.findById(item.id);
                    
                    if (!product) {
                        return { 
                            id: item.id, 
                            available: false, 
                            message: 'Product not found' 
                        };
                    }
                    
                    if (!product.inStock) {
                        return { 
                            id: item.id, 
                            available: false, 
                            message: `${product.name} is currently out of stock` 
                        };
                    }
                    
                    // Check quantity if tracking is enabled
                    if (product.quantity !== undefined && product.quantity < item.quantity) {
                        return { 
                            id: item.id, 
                            available: false, 
                            message: `Only ${product.quantity} of ${product.name} available` 
                        };
                    }
                    
                    return { 
                        id: item.id, 
                        available: true, 
                        message: 'Available',
                        currentStock: product.quantity
                    };
                } catch (error) {
                    console.error('Error checking product:', item.id, error);
                    return { 
                        id: item.id, 
                        available: false, 
                        message: 'Error checking availability' 
                    };
                }
            })
        );
        
        const unavailableItems = inventoryChecks.filter(check => !check.available);
        
        if (unavailableItems.length > 0) {
            return res.json({
                success: false,
                message: unavailableItems[0].message,
                unavailableItems,
                allChecks: inventoryChecks
            });
        }
        
        res.json({ 
            success: true, 
            message: 'All items are available',
            inventoryChecks 
        });
    } catch (error) {
        console.error('Error checking inventory:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking inventory' 
        });
    }
});

// PUT /api/products/:id/stock - Update product stock
router.put('/:id/stock', async (req, res) => {
    try {
        const { quantity, operation } = req.body; // operation: 'set', 'add', 'subtract'
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        let newQuantity;
        switch (operation) {
            case 'set':
                newQuantity = quantity;
                break;
            case 'add':
                newQuantity = product.quantity + quantity;
                break;
            case 'subtract':
                newQuantity = Math.max(0, product.quantity - quantity);
                break;
            default:
                return res.status(400).json({ message: 'Invalid operation' });
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { 
                quantity: newQuantity,
                inStock: newQuantity > 0,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ message: 'Error updating stock' });
    }
});

// GET /api/products/low-stock - Get products with low stock
router.get('/low-stock', async (req, res) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
        }).sort({ quantity: 1 });
        
        res.json(products);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ message: 'Error fetching low stock products' });
    }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        productData.updatedAt = new Date();
        
        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();
        
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
    try {
        const updateData = req.body;
        updateData.updatedAt = new Date();
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

module.exports = router;
