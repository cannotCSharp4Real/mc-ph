# MC-PH Coffee Shop - Complete Ordering Flow

## 🌟 Overview
This documentation covers the complete ordering flow from customer browsing to staff order management, including real-time notifications and status updates.

## 📋 Complete Order Flow

### 1. Customer Journey

#### **Authentication & Browsing**
- Customer signs in through `/auth.html`
- Redirected to `/menu.html` to browse products
- Products loaded from database via `/api/products`

#### **Product Selection & Customization**
- Customer clicks "Add to Cart" on any product
- Customization modal opens with options:
  - **Size selection** (Small, Medium, Large)
  - **Add-ons** (Extra Shot, Milk alternatives, Syrups)
  - **Quantity** adjustment
  - **Real-time price calculation**

#### **Cart Management**
- Items added to cart with customizations
- Cart data stored in `localStorage`
- Cart icon shows item count
- Navigate to `/cart.html` for checkout

#### **Checkout Process**
- **Order Type Selection**: Pickup or Delivery
- **Customer Information**: Name, email, phone
- **Delivery Details**: Address (if delivery selected)
- **Payment Method**: Cash, Card, or E-wallet
- **Order Summary**: Items, totals, taxes
- **Promo Code**: Optional discount application

#### **Order Placement**
- Form validation and inventory check
- Order submitted to `/api/orders`
- **Staff notification triggered**
- Customer receives order confirmation
- Cart cleared and success message shown

### 2. Staff Dashboard Experience

#### **Real-time Order Management**
- Staff dashboard at `/staff.html`
- Three-column workflow:
  - **Incoming Orders**: New orders with "Accept" button
  - **In Progress**: Accepted orders with "Ready" button
  - **Completed**: Finished orders

#### **Order Processing**
1. **New Order Notification**:
   - Sound notification plays
   - Red dot appears on Orders menu
   - Order appears in "Incoming Orders" column

2. **Accept Order**:
   - Staff clicks "Accept" button
   - Order moves to "In Progress" column
   - Customer notified via `/api/orders/:id/notify`
   - Order status updated to "preparing"

3. **Mark Order Ready**:
   - Staff clicks "Ready" button
   - Order moves to "Completed" column
   - Customer notified order is ready
   - Order status updated to "completed"

### 3. Notification System

#### **Staff Notifications**
- Real-time sound alerts for new orders
- Visual notification badge on Orders menu
- Browser notifications (if permissions granted)
- LocalStorage backup for offline notifications

#### **Customer Notifications**
- Order status updates via email/SMS simulation
- Notifications stored in database
- Status updates for: Accepted, Preparing, Ready, Completed

## 🔧 Technical Implementation

### **Frontend Components**

#### **Menu Page (`menu.html` + `menu.js`)**
```javascript
// Key features:
- Product loading from database
- Category filtering
- Search functionality
- Customization modal
- Cart management
- Real-time price calculation
```

#### **Cart Page (`cart.html` + `cart.js`)**
```javascript
// Key features:
- Cart item display
- Order type selection (pickup/delivery)
- Customer information form
- Payment method selection
- Promo code application
- Order submission
- Staff notification trigger
```

#### **Staff Dashboard (`staff.html` + `staff.js`)**
```javascript
// Key features:
- Real-time order loading
- Three-column order workflow
- Order status management
- Sound notifications
- Customer notification sending
- Inventory management
```

### **Backend APIs**

#### **Orders API (`/api/orders`)**
```javascript
// Endpoints:
GET    /api/orders              // Get all orders
POST   /api/orders              // Create new order
GET    /api/orders/:id          // Get single order
PUT    /api/orders/:id/status   // Update order status
POST   /api/orders/:id/notify   // Send customer notification
POST   /api/orders/check-inventory // Check item availability
```

#### **Products API (`/api/products`)**
```javascript
// Endpoints:
GET    /api/products            // Get all products
POST   /api/products            // Create new product
PUT    /api/products/:id        // Update product
DELETE /api/products/:id        // Delete product
```

#### **Notifications API**
```javascript
// Endpoints:
POST   /api/staff/notifications // Handle staff notifications
GET    /api/notifications       // Get customer notifications
```

### **Database Schema**

#### **Orders Collection**
```javascript
{
  _id: ObjectId,
  orderNumber: String,
  customerId: ObjectId,
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  items: [{
    productId: ObjectId,
    name: String,
    quantity: Number,
    price: Number,
    size: String,
    addons: Array,
    total: Number
  }],
  orderType: String, // 'pickup' or 'delivery'
  deliveryInfo: Object,
  paymentMethod: String,
  subtotal: Number,
  tax: Number,
  total: Number,
  status: String, // 'pending', 'preparing', 'ready', 'completed'
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date,
  estimatedPrepTime: Number
}
```

#### **Products Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: String,
  inStock: Boolean,
  image: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Notifications Collection**
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  customerId: ObjectId,
  customerEmail: String,
  message: String,
  type: String,
  status: String,
  createdAt: Date,
  read: Boolean
}
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB database
- Modern web browser

### **Installation**
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Start the server: `npm start`
5. Open browser to `http://localhost:3002`

### **Testing the Flow**
```bash
# Run the complete order flow test
node test-order-flow.js

# Clean up test data
node test-order-flow.js cleanup
```

## 📱 User Experience Features

### **Customer Features**
- ✅ Product browsing with categories
- ✅ Search functionality
- ✅ Product customization modal
- ✅ Real-time price calculation
- ✅ Cart management
- ✅ Order type selection (pickup/delivery)
- ✅ Multiple payment methods
- ✅ Promo code support
- ✅ Order confirmation
- ✅ Mobile responsive design

### **Staff Features**
- ✅ Real-time order notifications
- ✅ Sound alerts for new orders
- ✅ Three-column order workflow
- ✅ Order status management
- ✅ Customer notifications
- ✅ Inventory management
- ✅ Order history tracking
- ✅ Mobile responsive dashboard

### **System Features**
- ✅ Real-time order synchronization
- ✅ Inventory checking
- ✅ Notification system
- ✅ Order status tracking
- ✅ Data persistence
- ✅ Error handling
- ✅ Security measures

## 🔔 Notification Flow

### **New Order Process**
1. Customer places order → Cart.js triggers notification
2. Staff dashboard receives notification → Sound plays
3. Visual indicator appears → Red dot on Orders menu
4. Order appears in "Incoming Orders" column
5. Staff accepts order → Customer receives notification
6. Order moves to "In Progress" → Status updated in database
7. Staff marks ready → Customer receives notification
8. Order moves to "Completed" → Final status update

### **Notification Channels**
- **Visual**: Red notification dot, order cards
- **Audio**: Sound alerts for new orders
- **Database**: Persistent notification storage
- **LocalStorage**: Offline notification backup

## 🔐 Security & Performance

### **Security Features**
- Input sanitization
- CORS configuration
- Rate limiting
- Helmet security headers
- Data validation

### **Performance Optimizations**
- Efficient database queries
- LocalStorage caching
- Lazy loading
- Optimized image handling
- Minimal API calls

## 📊 Monitoring & Analytics

### **Order Tracking**
- Real-time order status
- Completion time tracking
- Customer satisfaction metrics
- Staff performance monitoring

### **Business Insights**
- Popular product tracking
- Peak hours analysis
- Revenue calculations
- Customer behavior patterns

## 🐛 Troubleshooting

### **Common Issues**
1. **Orders not appearing**: Check database connection
2. **Notifications not working**: Verify browser permissions
3. **Cart not updating**: Clear localStorage
4. **API errors**: Check server logs
5. **Database errors**: Verify MongoDB connection

### **Debug Tools**
- Browser developer tools
- Server console logs
- Database query logs
- Network request monitoring

## 🔄 Future Enhancements

### **Planned Features**
- WebSocket real-time updates
- Advanced inventory management
- Customer loyalty program
- Advanced reporting dashboard
- Mobile app integration
- Payment gateway integration

This complete ordering flow provides a seamless experience from customer browsing to staff order fulfillment, with real-time notifications and comprehensive order management capabilities.
