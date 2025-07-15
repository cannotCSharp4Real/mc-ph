# Coffee Shop Cart & Checkout System

A comprehensive cart and checkout system for the CoffeeFlow coffee shop e-commerce platform, featuring modern design, secure processing, and intuitive user experience.

## Features

### 🛒 Cart Management
- **Item Display**: Product images, names, quantities, and prices
- **Quantity Controls**: Plus/minus buttons with validation (1-99 items)
- **Real-time Updates**: Instant price calculations and cart totals
- **Remove Items**: Individual item removal with confirmation
- **Clear Cart**: Complete cart clearing with confirmation
- **Persistent Storage**: Cart data saved to localStorage
- **Empty State**: Friendly empty cart message with call-to-action

### 💳 Checkout Process
- **Customer Information**: Name, email, and phone number fields
- **Order Type Selection**: Pickup vs. delivery options
- **Delivery Address**: Complete address form (shown only for delivery)
- **Payment Methods**: Cash, credit/debit card, and digital wallets
- **Order Notes**: Special instructions and dietary restrictions
- **Form Validation**: Real-time validation with error messages
- **Security**: Input sanitization and CSP protection

### 🧾 Order Summary
- **Itemized Breakdown**: Detailed list of all cart items
- **Price Calculations**: Subtotal, tax (8.25%), and delivery fees
- **Promo Codes**: Discount code application with validation
- **Estimated Time**: Pickup/delivery time estimates
- **Sticky Sidebar**: Always visible order summary

### 🔐 Security Features
- **Input Sanitization**: Protection against XSS attacks
- **Form Validation**: Client-side and server-side validation
- **CSRF Protection**: Token-based request validation
- **Secure Storage**: Safe handling of sensitive data
- **Payment Security**: PCI-compliant payment processing

### 📱 User Experience
- **Responsive Design**: Mobile-first approach
- **Loading States**: Visual feedback during processing
- **Success/Error Messages**: Clear user feedback
- **Keyboard Navigation**: Full accessibility support
- **Touch Optimization**: Enhanced mobile interaction
- **Dark Mode**: Automatic theme detection

## File Structure

```
frontend/
├── cart.html                 # Main cart and checkout page
├── css/
│   └── cart.css              # Main cart styles
└── js/
    └── cart.js               # Cart functionality and logic

backend/
├── routes/
│   ├── orders.js             # Order management endpoints
│   └── products.js           # Product and inventory management
└── models/
    └── Order.js              # Order data model
```

## API Endpoints

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `POST /api/orders/check-inventory` - Verify product availability
- `POST /api/orders/send-confirmation` - Send order confirmation
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Products
- `GET /api/products` - Get all products
- `POST /api/products/check-inventory` - Check stock levels
- `PUT /api/products/:id/stock` - Update inventory
- `GET /api/products/low-stock` - Get low stock items

## Usage

### Basic Cart Operations

```javascript
// Add item to cart
const cartItem = {
    id: 'product-id',
    name: 'Product Name',
    price: 4.99,
    quantity: 1,
    totalPrice: 4.99
};
cartPage.cart.push(cartItem);
cartPage.saveCart();

// Update quantity
cartPage.updateQuantity(itemIndex, newQuantity, true);

// Remove item
cartPage.removeItem(itemIndex);

// Clear cart
cartPage.clearCart();
```

### Promo Code System

```javascript
// Available promo codes
const promoCodes = {
    'WELCOME10': { discount: 0.10, type: 'percentage' },
    'SAVE5': { discount: 5.00, type: 'fixed' },
    'FREESHIP': { discount: 'delivery', type: 'special' }
};

// Apply promo code
cartPage.applyPromoCode();
```

### Order Processing

```javascript
// Place order
const orderData = {
    customerInfo: { name, email, phone },
    items: cartItems,
    orderType: 'pickup' | 'delivery',
    paymentMethod: 'cash' | 'card' | 'digital',
    total: calculatedTotal
};

const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
});
```

## Customization

### Styling
- Modify `cart.css` for main styles
- Responsive breakpoints configurable in CSS

### Business Logic
- Tax rates configurable in `CartPage` constructor
- Delivery fees adjustable per location
- Promo codes easily manageable in JavaScript

### Payment Integration
- Payment processors configurable in `PaymentProcessor` class
- Support for Stripe, PayPal, and other providers
- Secure tokenization for card data

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Considerations

1. **Input Validation**: All form inputs are validated and sanitized
2. **CSP Headers**: Content Security Policy prevents XSS attacks
3. **HTTPS Required**: All payment processing requires secure connections
4. **Token-based Auth**: CSRF protection for all form submissions
5. **PCI Compliance**: Payment card data handled securely

## Testing

### Manual Testing
1. Open `test-cart.html` to add test items
2. Navigate to `cart.html` to test functionality
3. Try different scenarios (empty cart, full cart, various payment methods)

### Automated Testing
```bash
# Run backend tests
npm test

# Run frontend tests
npm run test:frontend
```

## Deployment

### Environment Variables
```bash
DATABASE_URL=mongodb://localhost:27017/coffee-shop
TAX_RATE=0.0825
DELIVERY_FEE=3.99
STRIPE_SECRET_KEY=sk_test_...
```

### Production Checklist
- [ ] Enable HTTPS
- [ ] Configure payment processor
- [ ] Set up email service
- [ ] Configure monitoring
- [ ] Test all payment methods
- [ ] Verify mobile responsiveness

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions:
- Email: support@coffeeflow.com
- Documentation: [docs.coffeeflow.com](https://docs.coffeeflow.com)
- Issues: [GitHub Issues](https://github.com/coffeeflow/cart-system/issues)

---

**CoffeeFlow Cart & Checkout System** - Bringing the perfect coffee ordering experience to your customers. ☕
