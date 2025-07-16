document.addEventListener('DOMContentLoaded', function() {
    // Initialize staff dashboard
    checkStaffAuth();
    loadOrders();
    setupEventListeners();
    updateDateTime();
    
    // Update datetime every second
    setInterval(updateDateTime, 1000);
    
    // Refresh orders every 30 seconds
    setInterval(loadOrders, 30000);
});

function checkStaffAuth() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    if (!token || user.role !== 'staff') {
        // Redirect to login if not authenticated or not staff
        window.location.href = 'auth.html';
        return;
    }
}

function setupEventListeners() {
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutLink').addEventListener('click', logout);
    
    // Profile dropdown
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Separate orders by status
    const incomingOrders = orders.filter(order => order.status === 'pending');
    const inProgressOrders = orders.filter(order => order.status === 'in-progress');
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // Render orders in each column
    renderOrderCards('incomingOrders', incomingOrders, 'incoming');
    renderOrderCards('inProgressOrders', inProgressOrders, 'in-progress');
    renderOrderCards('completedOrders', completedOrders, 'completed');
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
            return `<button class="action-btn accept-btn" onclick="acceptOrder('${orderId}')">Accept</button>`;
        case 'in-progress':
            return `<button class="action-btn ready-btn" onclick="markReady('${orderId}')">Ready</button>`;
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
    updateOrderStatus(orderId, 'completed');
    showNotification('Order marked as ready and completed', 'success');
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        orders[orderIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify(orders));
        
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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
