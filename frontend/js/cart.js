document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart page
    loadCartItems();
    setupEventListeners();
    checkAuthStatus();
});

function setupEventListeners() {
    // Order type buttons
    document.getElementById('pickupBtn').addEventListener('click', function() {
        selectOrderType('pickup');
    });

    document.getElementById('deliveryBtn').addEventListener('click', function() {
        selectOrderType('delivery');
    });

    // Place order button
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);

    // Profile dropdown
    document.getElementById('orderHistoryLink').addEventListener('click', function(e) {
        e.preventDefault();
        showOrderHistory();
    });

    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Order history modal
    document.getElementById('closeOrderHistoryModal').addEventListener('click', function() {
        document.getElementById('orderHistoryModal').style.display = 'none';
    });
}

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'auth.html';
        return;
    }
}

function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some items from the menu to get started!</p>
            </div>
        `;
        updateOrderSummary([]);
        return;
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">
                    ${item.size ? `Size: ${item.size}` : ''}
                    ${item.addons && item.addons.length > 0 ? `<br>Add-ons: ${item.addons.join(', ')}` : ''}
                </div>
                <div class="cart-item-price">₱${item.totalPrice}</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
        </div>
    `).join('');

    updateOrderSummary(cart);
}

function updateQuantity(index, change) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart[index];
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart.splice(index, 1);
        } else {
            // Recalculate total price
            const basePrice = item.basePrice || 0;
            const sizePrice = item.sizePrice || 0;
            const addonsPrice = item.addonsPrice || 0;
            item.totalPrice = (basePrice + sizePrice + addonsPrice) * item.quantity;
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
    }
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
}

function updateOrderSummary(cart) {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderType = document.querySelector('.order-type-btn.active').id;
    const deliveryFee = orderType === 'deliveryBtn' ? 50 : 0;
    const total = subtotal + deliveryFee;

    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `₱${deliveryFee.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
}

function selectOrderType(type) {
    const pickupBtn = document.getElementById('pickupBtn');
    const deliveryBtn = document.getElementById('deliveryBtn');
    const deliveryInfo = document.getElementById('deliveryInfo');

    if (type === 'pickup') {
        pickupBtn.classList.add('active');
        deliveryBtn.classList.remove('active');
        deliveryInfo.style.display = 'none';
    } else {
        deliveryBtn.classList.add('active');
        pickupBtn.classList.remove('active');
        deliveryInfo.style.display = 'block';
    }

    // Update delivery fee
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateOrderSummary(cart);
}

function placeOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const orderType = document.querySelector('.order-type-btn.active').id;
    const isDelivery = orderType === 'deliveryBtn';

    // Validate delivery information if needed
    if (isDelivery) {
        const fullName = document.getElementById('fullName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const address = document.getElementById('address').value.trim();

        if (!fullName || !phoneNumber || !address) {
            alert('Please fill in all required delivery information.');
            return;
        }
    }

    const orderData = {
        items: cart,
        orderType: isDelivery ? 'delivery' : 'pickup',
        deliveryInfo: isDelivery ? {
            fullName: document.getElementById('fullName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            address: document.getElementById('address').value,
            landmark: document.getElementById('landmark').value
        } : null,
        subtotal: cart.reduce((sum, item) => sum + item.totalPrice, 0),
        deliveryFee: isDelivery ? 50 : 0,
        total: cart.reduce((sum, item) => sum + item.totalPrice, 0) + (isDelivery ? 50 : 0),
        timestamp: new Date().toISOString()
    };

    // Save order to localStorage (in a real app, this would be sent to the server)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderId = 'ORD-' + Date.now();
    const newOrder = {
        id: orderId,
        ...orderData,
        status: 'pending'
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Trigger notification for new order
    if (window.notificationManager) {
        notificationManager.sendNewOrderNotification(newOrder);
    }
    
    console.log('✅ Order created:', newOrder);

    // Clear cart
    localStorage.removeItem('cart');

    alert(`Order placed successfully! Order ID: ${orderId}`);
    
    // Redirect to menu
    window.location.href = 'menu.html';
}

function showOrderHistory() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderHistoryList = document.getElementById('orderHistoryList');
    
    if (orders.length === 0) {
        orderHistoryList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-history"></i>
                <h3>No orders yet</h3>
                <p>Your order history will appear here.</p>
            </div>
        `;
    } else {
        orderHistoryList.innerHTML = orders.map(order => `
            <div class="order-history-item">
                <div class="order-header">
                    <div class="order-id">${order.id}</div>
                    <div class="order-date">${new Date(order.timestamp).toLocaleDateString()}</div>
                    <div class="order-status ${order.status}">${order.status}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
                </div>
                <div class="order-total">Total: ₱${order.total.toFixed(2)}</div>
            </div>
        `).join('');
    }
    
    document.getElementById('orderHistoryModal').style.display = 'block';
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderHistoryModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
