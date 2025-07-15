# 🚀 MC-PH Coffee Shop - Quick Setup Guide

## Step 1: Start the Server
```bash
cd "c:\Users\Ren\Documents\code\mc-ph"
npm start
```

## Step 2: Open the Application
Open your browser and navigate to:
- **Customer Interface**: `http://localhost:3002/menu.html`
- **Staff Dashboard**: `http://localhost:3002/staff.html`

## Step 3: Test the Complete Flow

### **Customer Side (menu.html)**
1. Browse products on the menu page
2. Click "Add to Cart" on any item
3. Use the customization modal to select size, add-ons
4. Add items to cart and navigate to cart page
5. Fill out order form (name, email, phone)
6. Select pickup or delivery
7. Choose payment method
8. Click "Place Order"

### **Staff Side (staff.html)**
1. Keep staff dashboard open
2. When customer places order, you'll hear a sound notification
3. Red dot appears on "Orders" menu
4. New order appears in "Incoming Orders" column
5. Click "Accept" to move to "In Progress"
6. Click "Ready" to move to "Completed"

## 🎯 Key Features to Test

### **Real-time Notifications**
- ✅ Sound alerts when new orders arrive
- ✅ Visual notification badges
- ✅ Order cards update in real-time
- ✅ Customer notifications for status updates

### **Order Management**
- ✅ Three-column workflow (Incoming → In Progress → Completed)
- ✅ Order status tracking
- ✅ Customer information display
- ✅ Order totals and payment info

### **Customization System**
- ✅ Product size selection
- ✅ Add-on options (extra shots, milk alternatives, syrups)
- ✅ Real-time price calculation
- ✅ Quantity adjustment

### **Cart & Checkout**
- ✅ Cart item management
- ✅ Order type selection (pickup/delivery)
- ✅ Customer information form
- ✅ Payment method selection
- ✅ Promo code application

## 🔧 Database Test Commands

```bash
# Run comprehensive flow test
node test-order-flow.js

# Clean up test data
node test-order-flow.js cleanup
```

## 🎉 Success Indicators

When everything is working correctly, you should see:
- Products loading on menu page
- Customization modal opening with options
- Cart updating with selected items
- Order placement triggering staff notification
- Sound playing on staff dashboard
- Order appearing in "Incoming Orders" column
- Status updates working between columns
- Customer notifications being logged

## 🚨 Troubleshooting

If something doesn't work:
1. Check server console for errors
2. Verify MongoDB connection
3. Check browser console for JavaScript errors
4. Ensure all required files are present
5. Try refreshing both customer and staff pages

## 📱 Mobile Testing

The system is responsive and works on mobile devices:
- Open `http://localhost:3002/menu.html` on mobile
- Test the ordering flow on smaller screens
- Verify touch interactions work properly

Your complete ordering flow is now ready! 🎊
