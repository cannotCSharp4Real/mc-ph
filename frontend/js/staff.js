document.addEventListener('DOMContentLoaded', function() {
    // Initialize staff dashboard
    checkStaffAuth();
    loadOrders();
    setupEventListeners();
    updateDateTime();
    
    // Setup logout buttons immediately
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutLink = document.getElementById('logoutLink');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✅ Logout button event listener attached');
    } else {
        console.log('❌ Logout button not found');
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', logout);
        console.log('✅ Logout link event listener attached');
    } else {
        console.log('❌ Logout link not found');
    }
    
    // Update datetime every second
    setInterval(updateDateTime, 1000);
    
    // Refresh orders every 30 seconds
    setInterval(loadOrders, 30000);
});

function checkStaffAuth() {
    const token = localStorage.getItem('authToken');
    // Check both possible user storage keys for compatibility
    const userData = localStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔐 Staff auth check:', { token: !!token, user: user, role: user.role });
    
    if (!token || user.role !== 'staff') {
        console.log('❌ Staff auth failed - redirecting to login');
        // Redirect to login if not authenticated or not staff
        window.location.href = 'auth.html';
        return;
    }
    
    console.log('✅ Staff authenticated successfully');
}

function setupEventListeners() {
    // Profile dropdown
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function loadOrders() {
    console.log('🔄 Loading orders from localStorage...');
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    console.log('📦 Found orders:', orders.length);
    
    if (orders.length > 0) {
        console.log('📋 Orders details:');
        orders.forEach((order, index) => {
            console.log(`  ${index + 1}. ${order.id} - Status: ${order.status} - Total: ₱${order.total}`);
        });
    }
    
    // Separate orders by status
    const incomingOrders = orders.filter(order => order.status === 'pending');
    const inProgressOrders = orders.filter(order => order.status === 'in-progress');
    const readyOrders = orders.filter(order => order.status === 'ready');
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    console.log('📊 Order counts by status:');
    console.log(`  Incoming (pending): ${incomingOrders.length}`);
    console.log(`  In Progress: ${inProgressOrders.length}`);
    console.log(`  Ready: ${readyOrders.length}`);
    console.log(`  Completed: ${completedOrders.length}`);
    
    // Render orders in each column - combine ready and completed in the last column
    renderOrderCards('incomingOrders', incomingOrders, 'incoming');
    renderOrderCards('inProgressOrders', inProgressOrders, 'in-progress');
    renderOrderCards('completedOrders', [...readyOrders, ...completedOrders], 'ready');
}

function renderOrderCards(containerId, orders, status) {
    const container = document.getElementById(containerId);
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No orders</h3>
                <p>Orders will appear here when available.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-id">${order.id}</div>
                <div class="order-time">${formatTime(order.timestamp)}</div>
            </div>
            <div class="order-details">
                <div class="order-items">
                    <strong>Items:</strong> ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
                </div>
                <div class="order-total">Total: ₱${order.total.toFixed(2)}</div>
                ${order.orderType === 'delivery' ? `
                    <div class="delivery-info">
                        <strong>Delivery to:</strong> ${order.deliveryInfo.fullName}<br>
                        <strong>Address:</strong> ${order.deliveryInfo.address}<br>
                        <strong>Phone:</strong> ${order.deliveryInfo.phoneNumber}
                    </div>
                ` : '<div class="pickup-info"><strong>Type:</strong> Pickup</div>'}
            </div>
            <div class="order-actions">
                ${getActionButtons(order.status, order.id)}
            </div>
        </div>
    `).join('');
    
    // Add event listeners for action buttons
    addActionListeners(containerId, orders, status);
}

function getActionButtons(status, orderId) {
    switch (status) {
        case 'pending':
        case 'incoming':
            return `<button class="action-btn accept-btn" onclick="acceptOrder('${orderId}')">Accept</button>`;
        case 'in-progress':
            return `<button class="action-btn ready-btn" onclick="markReady('${orderId}')">Ready</button>`;
        case 'ready':
            return `<button class="action-btn complete-btn" onclick="markCompleted('${orderId}')">Complete</button>`;
        case 'completed':
            return `<button class="action-btn complete-btn" disabled>Completed</button>`;
        default:
            return '';
    }
}

function addActionListeners(containerId, orders, status) {
    const container = document.getElementById(containerId);
    const actionButtons = container.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const orderId = this.closest('.order-card').dataset.orderId;
            
            if (this.classList.contains('accept-btn')) {
                acceptOrder(orderId);
            } else if (this.classList.contains('ready-btn')) {
                markReady(orderId);
            }
        });
    });
}

function acceptOrder(orderId) {
    updateOrderStatus(orderId, 'in-progress');
    showNotification('Order accepted and moved to In Progress', 'success');
}

function markReady(orderId) {
    updateOrderStatus(orderId, 'ready');
    showNotification('Order marked as ready for pickup', 'success');
}

function markCompleted(orderId) {
    updateOrderStatus(orderId, 'completed');
    
    // Create sales record when order is completed
    createSalesRecord(orderId);
    
    showNotification('Order completed and sales record created', 'success');
}

function createSalesRecord(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Get current user (staff) info
    const userData = localStorage.getItem('userData');
    const staffUser = userData ? JSON.parse(userData) : JSON.parse(localStorage.getItem('user') || '{}');
    
    // Create sales record
    const saleRecord = {
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId: order.id,
        orderNumber: order.id,
        customerId: order.customerId || 'guest',
        customerInfo: order.customerInfo || { name: 'Guest Customer' },
        staffId: staffUser.id || 'staff-001',
        staffName: staffUser.username || 'Staff User',
        items: order.items.map(item => ({
            ...item,
            productId: item.productId || item.name.toLowerCase().replace(/\s+/g, '-'),
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            category: item.category || 'drinks',
            size: item.size || 'regular',
            addons: item.addons || []
        })),
        subtotal: order.subtotal || (order.total * 0.893), // Approximate subtotal if not present
        tax: order.tax || (order.total * 0.107), // 12% tax
        discount: order.discount || 0,
        tip: order.tip || 0,
        total: order.total,
        paymentMethod: order.paymentMethod || 'cash',
        paymentId: order.paymentId || null,
        orderType: order.type || order.orderType || 'pickup',
        saleDate: new Date().toISOString(),
        shift: determineShift(),
        location: 'main-store',
        promotions: order.promotions || [],
        loyaltyPointsUsed: order.loyaltyPointsUsed || 0,
        loyaltyPointsEarned: Math.floor(order.total * 0.1), // 10% of total as loyalty points
        refunded: false,
        refundDate: null,
        refundAmount: 0,
        refundReason: null,
        notes: order.specialInstructions || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Store sales record
    const salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    salesRecords.push(saleRecord);
    localStorage.setItem('salesRecords', JSON.stringify(salesRecords));
    
    console.log('✅ Sales record created:', saleRecord);
}

function determineShift() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        const oldStatus = orders[orderIndex].status;
        orders[orderIndex].status = newStatus;
        orders[orderIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Trigger notification for status change
        if (window.notificationManager && oldStatus !== newStatus) {
            const order = orders[orderIndex];
            notificationManager.sendOrderStatusNotification(order, oldStatus);
        }
        
        // Reload orders to update the display
        loadOrders();
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    document.getElementById('currentDateTime').textContent = dateTimeString;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function logout() {
    console.log('🚪 Logging out staff user...');
    
    // Clear all authentication tokens and user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('user');
    
    console.log('✅ Authentication data cleared');
    
    // Redirect to login page
    window.location.href = 'auth.html';
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(dropdown => {
        if (!dropdown.parentElement.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        loadOrders();
        showNotification('Orders refreshed', 'info');
    }
});

// Test function to create sample orders for testing
function createTestOrders() {
    console.log('🧪 Creating test orders...');
    
    const testOrders = [
        {
            id: 'ORD-' + Date.now() + '_1',
            customerInfo: {
                name: 'John Doe',
                phone: '123-456-7890',
                email: 'john@example.com'
            },
            items: [
                {
                    name: 'Spanish Latte',
                    price: 120,
                    quantity: 2,
                    size: 'regular',
                    addons: [],
                    totalPrice: 240
                },
                {
                    name: 'Croissant',
                    price: 85,
                    quantity: 1,
                    size: 'regular',
                    addons: [],
                    totalPrice: 85
                }
            ],
            subtotal: 325,
            tax: 39,
            total: 364,
            paymentMethod: 'cash',
            type: 'pickup',
            orderType: 'pickup',
            status: 'pending',
            timestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'ORD-' + Date.now() + '_2',
            customerInfo: {
                name: 'Jane Smith',
                phone: '987-654-3210',
                email: 'jane@example.com'
            },
            items: [
                {
                    name: 'Americano',
                    price: 80,
                    quantity: 1,
                    size: 'regular',
                    addons: [],
                    totalPrice: 80
                }
            ],
            subtotal: 80,
            tax: 9.6,
            total: 89.6,
            paymentMethod: 'card',
            type: 'pickup',
            orderType: 'pickup',
            status: 'in-progress',
            timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            updatedAt: new Date().toISOString()
        },
        {
            id: 'ORD-' + Date.now() + '_3',
            customerInfo: {
                name: 'Bob Johnson',
                phone: '555-123-4567',
                email: 'bob@example.com'
            },
            items: [
                {
                    name: 'Plain Chocolate',
                    price: 145,
                    quantity: 1,
                    size: 'regular',
                    addons: [],
                    totalPrice: 145
                }
            ],
            subtotal: 145,
            tax: 17.4,
            total: 162.4,
            paymentMethod: 'cash',
            type: 'pickup',
            orderType: 'pickup',
            status: 'ready',
            timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            updatedAt: new Date().toISOString()
        }
    ];
    
    // Save test orders to localStorage
    localStorage.setItem('orders', JSON.stringify(testOrders));
    
    console.log('✅ Test orders created:', testOrders.length);
    console.log('📋 Orders:', testOrders);
    
    // Reload the orders display
    if (typeof loadOrders === 'function') {
        loadOrders();
    }
    
    return testOrders;
}

// Call createTestOrders() in console to create test orders

// Debug function to check orders in localStorage
function debugOrders() {
    console.log('🔍 === DEBUGGING ORDERS ===');
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    console.log('📦 Total orders in localStorage:', orders.length);
    
    if (orders.length > 0) {
        console.log('📋 Orders details:');
        orders.forEach((order, index) => {
            console.log(`  ${index + 1}. ID: ${order.id}, Status: ${order.status}, Total: ₱${order.total}`);
            console.log(`     Items: ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}`);
            console.log(`     Created: ${order.timestamp}`);
        });
        
        const pendingOrders = orders.filter(order => order.status === 'pending');
        const inProgressOrders = orders.filter(order => order.status === 'in-progress');
        const readyOrders = orders.filter(order => order.status === 'ready');
        const completedOrders = orders.filter(order => order.status === 'completed');
        
        console.log('📊 Order counts by status:');
        console.log(`  Pending: ${pendingOrders.length}`);
        console.log(`  In Progress: ${inProgressOrders.length}`);
        console.log(`  Ready: ${readyOrders.length}`);
        console.log(`  Completed: ${completedOrders.length}`);
    } else {
        console.log('⚠️ No orders found in localStorage');
    }
    
    console.log('🔍 === END DEBUG ===');
}

// Call debugOrders() in console to check order state

// Complete order flow test
function testCompleteOrderFlow() {
    console.log('🧪 Testing complete order flow...');
    
    // Step 1: Clear existing data
    localStorage.removeItem('orders');
    localStorage.removeItem('lastKnownOrders');
    localStorage.removeItem('salesRecords');
    
    console.log('1️⃣ Cleared existing data');
    
    // Step 2: Create a new order (simulate customer placing order)
    const newOrder = {
        id: 'ORD-' + Date.now(),
        customerInfo: {
            name: 'Test Customer',
            phone: '123-456-7890',
            email: 'test@example.com'
        },
        items: [
            {
                name: 'Spanish Latte',
                price: 120,
                quantity: 1,
                size: 'regular',
                addons: [],
                totalPrice: 120
            },
            {
                name: 'Croissant',
                price: 85,
                quantity: 1,
                size: 'regular',
                addons: [],
                totalPrice: 85
            }
        ],
        subtotal: 205,
        tax: 24.6,
        total: 229.6,
        paymentMethod: 'cash',
        type: 'pickup',
        orderType: 'pickup',
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Step 3: Save the order
    localStorage.setItem('orders', JSON.stringify([newOrder]));
    console.log('2️⃣ Order created:', newOrder.id);
    
    // Step 4: Trigger notification (if available)
    if (window.notificationManager) {
        notificationManager.sendNewOrderNotification(newOrder);
    }
    
    // Step 5: Reload staff dashboard
    if (typeof loadOrders === 'function') {
        loadOrders();
        console.log('3️⃣ Staff dashboard reloaded');
    }
    
    // Step 6: Test order progression
    setTimeout(() => {
        console.log('4️⃣ Moving order to in-progress...');
        newOrder.status = 'in-progress';
        newOrder.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify([newOrder]));
        
        if (window.notificationManager) {
            notificationManager.sendOrderStatusNotification(newOrder, 'pending');
        }
        
        if (typeof loadOrders === 'function') {
            loadOrders();
        }
    }, 2000);
    
    setTimeout(() => {
        console.log('5️⃣ Moving order to ready...');
        newOrder.status = 'ready';
        newOrder.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify([newOrder]));
        
        if (window.notificationManager) {
            notificationManager.sendOrderStatusNotification(newOrder, 'in-progress');
        }
        
        if (typeof loadOrders === 'function') {
            loadOrders();
        }
    }, 4000);
    
    setTimeout(() => {
        console.log('6️⃣ Moving order to completed...');
        newOrder.status = 'completed';
        newOrder.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify([newOrder]));
        
        if (window.notificationManager) {
            notificationManager.sendOrderStatusNotification(newOrder, 'ready');
        }
        
        if (typeof loadOrders === 'function') {
            loadOrders();
        }
        
        console.log('✅ Order flow test completed!');
    }, 6000);
    
    return newOrder;
}

// Call testCompleteOrderFlow() to test the entire system
