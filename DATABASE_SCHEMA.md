# Coffee Shop Database Schema Documentation

## Overview
This document describes the MongoDB schema design for the Coffee Shop management system. The database consists of 5 main collections with proper relationships, validation rules, and indexes for optimal performance.

## Collections

### 1. Users Collection
**Purpose**: Store user accounts with role-based access control

**Schema Structure**:
```javascript
{
  _id: ObjectId,
  name: String (required, 2-100 chars),
  email: String (required, unique, valid email),
  password: String (required, bcrypt hashed),
  role: String (required, enum: ["customer", "staff", "manager", "admin"]),
  phone: String (optional, valid phone number),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String (default: "USA")
  },
  dateOfBirth: Date (optional),
  preferences: {
    favoriteProducts: [ObjectId], // Reference to products
    dietaryRestrictions: [String], // enum values
    preferredSize: String,
    notifications: {
      email: Boolean (default: true),
      sms: Boolean (default: false),
      push: Boolean (default: true)
    }
  },
  loyaltyPoints: Number (default: 0, min: 0),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `role`
- `phone` (sparse)
- `isActive`
- `createdAt` (descending)
- `loyaltyPoints` (descending)

**Relationships**:
- One-to-many with Orders (customerId)
- One-to-many with Sales (customerId, staffId)
- One-to-many with Inventory (createdBy)

---

### 2. Products Collection
**Purpose**: Store product catalog with detailed information

**Schema Structure**:
```javascript
{
  _id: ObjectId,
  name: String (required, 2-100 chars),
  description: String (required, max 500 chars),
  category: String (required, enum: ["coffee", "tea", "cold-drinks", "hot-drinks", "pastries", "sandwiches", "salads", "desserts", "merchandise"]),
  subcategory: String (optional),
  price: {
    base: Number (required, min: 0),
    small: Number (optional),
    medium: Number (optional),
    large: Number (optional),
    extraLarge: Number (optional)
  },
  sizes: [{
    size: String (enum: ["small", "medium", "large", "extra-large"]),
    price: Number (min: 0),
    calories: Number (optional)
  }],
  images: [{
    url: String (required),
    alt: String (required),
    isPrimary: Boolean (default: false)
  }],
  ingredients: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sugar: Number,
    sodium: Number,
    caffeine: Number
  },
  allergens: [String], // enum values
  isAvailable: Boolean (default: true),
  isFeatured: Boolean (default: false),
  preparationTime: Number (min: 1, in minutes),
  tags: [String],
  customizations: [{
    name: String (required),
    type: String (enum: ["milk", "syrup", "extra-shot", "sugar", "temperature", "other"]),
    options: [{
      name: String (required),
      price: Number (required)
    }]
  }],
  seasonalItem: Boolean (default: false),
  seasonalDates: {
    startDate: Date,
    endDate: Date
  },
  createdBy: ObjectId (required, reference to Users),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `name`
- `category`
- `subcategory`
- `isAvailable`
- `isFeatured`
- `tags`
- `price.base`
- `createdAt` (descending)
- Text index on `name`, `description`, `tags`

**Relationships**:
- Many-to-one with Users (createdBy)
- One-to-many with Order Items
- One-to-one with Inventory (productId)

---

### 3. Orders Collection
**Purpose**: Track customer orders with status and payment information

**Schema Structure**:
```javascript
{
  _id: ObjectId,
  orderNumber: String (required, unique, pattern: "CF[0-9]{9}"),
  customerId: ObjectId (required, reference to Users),
  customerInfo: {
    name: String (required),
    email: String (required),
    phone: String (optional)
  },
  items: [{
    productId: ObjectId (required, reference to Products),
    name: String (required),
    quantity: Number (required, min: 1),
    size: String (optional),
    price: Number (required, min: 0),
    total: Number (required, min: 0),
    customizations: [{
      name: String,
      option: String,
      price: Number
    }],
    specialInstructions: String (optional)
  }],
  subtotal: Number (required, min: 0),
  tax: Number (required, min: 0),
  discount: Number (default: 0, min: 0),
  tip: Number (default: 0, min: 0),
  total: Number (required, min: 0),
  paymentMethod: String (required, enum: ["cash", "card", "mobile-pay", "loyalty-points", "gift-card"]),
  paymentStatus: String (enum: ["pending", "processing", "completed", "failed", "refunded"]),
  paymentId: String (optional),
  orderType: String (enum: ["pickup", "delivery", "dine-in"]),
  status: String (enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
  priority: String (enum: ["low", "normal", "high", "urgent"]),
  specialInstructions: String (max 500 chars),
  estimatedPrepTime: Number (min: 1, in minutes),
  estimatedReadyTime: Date,
  actualReadyTime: Date (optional),
  deliveryInfo: {
    address: {
      street: String (required),
      city: String (required),
      state: String,
      zipCode: String (required),
      instructions: String (optional)
    },
    deliveryFee: Number (min: 0),
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date (optional),
    deliveryPersonId: ObjectId (optional, reference to Users)
  },
  assignedStaff: ObjectId (optional, reference to Users),
  loyaltyPointsUsed: Number (default: 0, min: 0),
  loyaltyPointsEarned: Number (default: 0, min: 0),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `orderNumber` (unique)
- `customerId`
- `status`
- `paymentStatus`
- `orderType`
- `priority`
- `createdAt` (descending)
- `estimatedReadyTime`
- `assignedStaff`

**Relationships**:
- Many-to-one with Users (customerId, assignedStaff)
- Many-to-many with Products (through items array)
- One-to-one with Sales (orderId)

---

### 4. Inventory Collection
**Purpose**: Manage stock levels and inventory tracking

**Schema Structure**:
```javascript
{
  _id: ObjectId,
  productId: ObjectId (required, unique, reference to Products),
  productName: String (required, 2-100 chars),
  category: String (required, enum: ["raw-materials", "finished-products", "packaging", "supplies", "equipment"]),
  currentStock: Number (required, min: 0),
  minimumStock: Number (required, min: 0),
  maximumStock: Number (required, min: 0),
  reorderLevel: Number (required, min: 0),
  reorderQuantity: Number (required, min: 1),
  unit: String (required, enum: ["pieces", "kg", "lbs", "oz", "ml", "l", "boxes", "bags", "cups"]),
  costPerUnit: Number (required, min: 0),
  totalValue: Number (required, min: 0),
  supplierId: ObjectId (optional),
  supplierName: String (optional),
  lastRestocked: Date (optional),
  expirationDate: Date (optional),
  batchNumber: String (optional),
  location: String (enum: ["main-storage", "freezer", "refrigerator", "dry-storage", "bar-area", "kitchen"]),
  isActive: Boolean (default: true),
  lowStockAlerts: Boolean (default: true),
  createdBy: ObjectId (required, reference to Users),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `productId` (unique)
- `category`
- `currentStock`
- `minimumStock`
- `reorderLevel`
- `location`
- `isActive`
- `expirationDate` (sparse)
- `lastRestocked` (descending)
- `supplierId` (sparse)

**Relationships**:
- One-to-one with Products (productId)
- Many-to-one with Users (createdBy)

---

### 5. Sales Collection
**Purpose**: Record completed transactions for reporting and analytics

**Schema Structure**:
```javascript
{
  _id: ObjectId,
  orderId: ObjectId (required, unique, reference to Orders),
  orderNumber: String (required, pattern: "CF[0-9]{9}"),
  customerId: ObjectId (required, reference to Users),
  customerInfo: {
    name: String (required),
    email: String (required),
    phone: String (optional),
    loyaltyMember: Boolean (default: false)
  },
  staffId: ObjectId (required, reference to Users),
  staffName: String (required),
  items: [{
    productId: ObjectId (required, reference to Products),
    name: String (required),
    category: String (required),
    quantity: Number (required, min: 1),
    size: String (optional),
    price: Number (required, min: 0),
    total: Number (required, min: 0),
    cost: Number (optional),
    profit: Number (optional),
    customizations: [{
      name: String,
      option: String,
      price: Number
    }]
  }],
  subtotal: Number (required, min: 0),
  tax: Number (required, min: 0),
  discount: Number (default: 0, min: 0),
  tip: Number (default: 0, min: 0),
  total: Number (required, min: 0),
  paymentMethod: String (required, enum: ["cash", "card", "mobile-pay", "loyalty-points", "gift-card"]),
  paymentId: String (optional),
  orderType: String (required, enum: ["pickup", "delivery", "dine-in"]),
  saleDate: Date (required),
  shift: String (enum: ["morning", "afternoon", "evening", "night"]),
  location: String (required),
  promotions: [{
    name: String (required),
    type: String (enum: ["percentage", "fixed-amount", "buy-one-get-one", "loyalty-discount"]),
    value: Number (required),
    description: String (optional)
  }],
  loyaltyPointsUsed: Number (default: 0, min: 0),
  loyaltyPointsEarned: Number (default: 0, min: 0),
  refunded: Boolean (default: false),
  refundDate: Date (optional),
  refundAmount: Number (default: 0, min: 0),
  refundReason: String (optional),
  notes: String (max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `orderId` (unique)
- `orderNumber`
- `customerId`
- `staffId`
- `saleDate` (descending)
- `shift`
- `location`
- `paymentMethod`
- `orderType`
- `refunded`
- `total` (descending)
- `items.category`
- `items.productId`
- Compound: `saleDate` + `location`
- Compound: `saleDate` + `staffId`

**Relationships**:
- One-to-one with Orders (orderId)
- Many-to-one with Users (customerId, staffId)
- Many-to-many with Products (through items array)

---

## Validation Rules

### Data Validation
- **Email Format**: Valid email pattern with regex validation
- **Phone Numbers**: International format validation
- **Monetary Values**: Minimum 0, proper decimal handling
- **Enums**: Strict validation for predefined values
- **Required Fields**: Enforced at schema level
- **String Lengths**: Min/max character limits
- **Date Ranges**: Logical date validation

### Business Rules
- **Stock Levels**: Current stock cannot be negative
- **Order Totals**: Must match calculated values
- **Payment Status**: Must align with order status
- **User Roles**: Hierarchical permission validation
- **Loyalty Points**: Cannot exceed earned amount
- **Seasonal Items**: Date range validation

---

## Relationships and References

### Primary Relationships
1. **Users → Orders**: One-to-many (customerId)
2. **Users → Sales**: One-to-many (customerId, staffId)
3. **Products → Inventory**: One-to-one (productId)
4. **Orders → Sales**: One-to-one (orderId)
5. **Products → Order Items**: One-to-many (productId)

### Secondary Relationships
- **Users → Products**: Many-to-one (createdBy)
- **Users → Inventory**: Many-to-one (createdBy)
- **Orders → Users**: Many-to-one (assignedStaff)

---

## Performance Optimizations

### Indexing Strategy
- **Unique Indexes**: Email, order numbers, product-inventory relationship
- **Compound Indexes**: Date-based queries, reporting queries
- **Sparse Indexes**: Optional fields to save space
- **Text Indexes**: Full-text search on products

### Query Optimization
- **Projection**: Select only needed fields
- **Aggregation**: Use MongoDB aggregation pipeline for complex queries
- **Pagination**: Limit results for large datasets
- **Caching**: Consider Redis for frequently accessed data

---

## Security Considerations

### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Schema-level validation
- **Access Control**: Role-based permissions
- **Data Encryption**: Sensitive data encryption at rest

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Proper token expiration
- **Role Validation**: Middleware for route protection

---

## Usage Examples

### Initialize Database
```javascript
const { initializeDatabase } = require('./backend/config/initDatabase');
await initializeDatabase();
```

### Create New Product
```javascript
const product = new Product({
  name: 'Latte',
  description: 'Smooth espresso with steamed milk',
  category: 'coffee',
  price: { base: 4.75 },
  createdBy: adminUserId
});
await product.save();
```

### Process Order
```javascript
const order = new Order({
  customerId: customerId,
  items: [{ productId, quantity: 2, price: 4.75 }],
  subtotal: 9.50,
  tax: 0.95,
  total: 10.45,
  paymentMethod: 'card'
});
await order.save();
```

### Generate Sales Report
```javascript
const report = await Sale.getSalesReport(startDate, endDate);
```

This schema provides a robust foundation for a coffee shop management system with proper data integrity, performance optimization, and business logic validation.
