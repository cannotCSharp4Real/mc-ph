// Staff Dashboard JavaScript
class StaffDashboard {
    constructor() {
        this.currentUser = null;
        this.currentTime = new Date();
        this.orders = {
            incoming: [],
            progress: [],
            completed: []
        };
        this.notifications = [];
        this.notificationSound = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateTime();
        this.loadOrders();
        this.loadNotifications();
        this.setupNotificationSound();
        this.startPolling();
        setInterval(() => this.updateTime(), 1000);
    }

    setupEventListeners() {
        // Menu navigation
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.menu-link').dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Order action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('accept-btn')) {
                this.acceptOrder(e.target);
            } else if (e.target.classList.contains('ready-btn')) {
                this.markOrderReady(e.target);
            }
        });

        // Listen for new order events
        window.addEventListener('newOrder', (e) => {
            this.handleNewOrderNotification(e.detail);
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadOrders();
            }
        });
    }

    setupNotificationSound() {
        try {
            this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmET');
        } catch (error) {
            console.error('Could not create notification sound:', error);
        }
    }

    startPolling() {
        // Poll for new orders every 5 seconds
        setInterval(() => {
            this.loadOrders();
        }, 5000);
    }

    async loadOrders() {
        try {
            const response = await fetch('/api/orders?status=all');
            if (response.ok) {
                const orders = await response.json();
                this.processOrders(orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            // Load sample orders if API fails
            this.loadSampleOrders();
        }
    }

    processOrders(orders) {
        // Group orders by status
        this.orders = {
            incoming: orders.filter(order => order.status === 'pending'),
            progress: orders.filter(order => order.status === 'preparing'),
            completed: orders.filter(order => order.status === 'completed')
        };

        // Update displays
        this.displayOrders('incomingOrders', this.orders.incoming, 'incoming');
        this.displayOrders('progressOrders', this.orders.progress, 'progress');
        this.displayOrders('completedOrders', this.orders.completed, 'completed');
        
        // Update notification badge
        this.updateNotificationBadge();
    }

    loadSampleOrders() {
        // Load sample orders for demonstration
        const sampleOrders = [
            {
                _id: 'ORD001',
                orderNumber: 'ORD001',
                customerInfo: { name: 'John Doe' },
                items: [
                    { name: 'Cappuccino', quantity: 2, size: 'Large' },
                    { name: 'Croissant', quantity: 1 }
                ],
                total: 245,
                orderType: 'pickup',
                status: 'pending',
                createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                estimatedPrepTime: 15
            },
            {
                _id: 'ORD002',
                orderNumber: 'ORD002',
                customerInfo: { name: 'Jane Smith' },
                items: [
                    { name: 'Americano', quantity: 1, size: 'Medium' },
                    { name: 'Blueberry Muffin', quantity: 1 }
                ],
                total: 185,
                orderType: 'delivery',
                status: 'preparing',
                createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
                estimatedPrepTime: 20
            },
            {
                _id: 'ORD003',
                orderNumber: 'ORD003',
                customerInfo: { name: 'Bob Johnson' },
                items: [
                    { name: 'Latte', quantity: 1, size: 'Large' },
                    { name: 'Grilled Sandwich', quantity: 1 }
                ],
                total: 320,
                orderType: 'pickup',
                status: 'completed',
                createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
                estimatedPrepTime: 25
            }
        ];

        this.processOrders(sampleOrders);
    }

    displayOrders(containerId, orders, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders</div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card ${type === 'completed' ? 'completed' : ''}" data-order-id="${order._id}">
                <div class="order-header">
                    <span class="order-number">#${order.orderNumber || order._id}</span>
                    <span class="order-type ${order.orderType}">${order.orderType}</span>
                </div>
                <div class="order-info">
                    <p><strong>Customer:</strong> ${order.customerInfo.name}</p>
                    <p><strong>Time:</strong> ${this.formatTime(order.createdAt)}</p>
                    <p><strong>Items:</strong> ${this.formatItems(order.items)}</p>
                    <p><strong>Total:</strong> ₱${order.total.toFixed(2)}</p>
                </div>
                ${type === 'incoming' ? '<button class="order-action-btn accept-btn">Accept</button>' : ''}
                ${type === 'progress' ? '<button class="order-action-btn ready-btn">Ready</button>' : ''}
                ${type === 'completed' ? `<div class="completion-time">Completed: ${this.formatTime(order.completedAt || order.createdAt)}</div>` : ''}
            </div>
        `).join('');
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    formatItems(items) {
        if (!items || items.length === 0) return 'No items';
        
        return items.map(item => {
            let itemStr = `${item.name}`;
            if (item.size) itemStr += ` (${item.size})`;
            if (item.quantity > 1) itemStr += ` x${item.quantity}`;
            return itemStr;
        }).join(', ');
    }

    async acceptOrder(button) {
        const orderCard = button.closest('.order-card');
        const orderId = orderCard.dataset.orderId;
        
        try {
            // Update order status in database
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'preparing' })
            });
            
            if (response.ok) {
                // Move order from incoming to progress
                const order = this.orders.incoming.find(o => o._id === orderId);
                if (order) {
                    order.status = 'preparing';
                    this.orders.incoming = this.orders.incoming.filter(o => o._id !== orderId);
                    this.orders.progress.push(order);
                    
                    // Update displays
                    this.displayOrders('incomingOrders', this.orders.incoming, 'incoming');
                    this.displayOrders('progressOrders', this.orders.progress, 'progress');
                    
                    // Notify customer
                    await this.notifyCustomer(orderId, 'accepted');
                    
                    this.showNotification('Order accepted and moved to preparation', 'success');
                }
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            this.showNotification('Error accepting order. Please try again.', 'error');
        }
    }

    async markOrderReady(button) {
        const orderCard = button.closest('.order-card');
        const orderId = orderCard.dataset.orderId;
        
        try {
            // Update order status in database
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'completed' })
            });
            
            if (response.ok) {
                // Move order from progress to completed
                const order = this.orders.progress.find(o => o._id === orderId);
                if (order) {
                    order.status = 'completed';
                    order.completedAt = new Date().toISOString();
                    this.orders.progress = this.orders.progress.filter(o => o._id !== orderId);
                    this.orders.completed.push(order);
                    
                    // Update displays
                    this.displayOrders('progressOrders', this.orders.progress, 'progress');
                    this.displayOrders('completedOrders', this.orders.completed, 'completed');
                    
                    // Notify customer
                    await this.notifyCustomer(orderId, 'ready');
                    
                    this.showNotification('Order marked as ready and completed', 'success');
                }
            }
        } catch (error) {
            console.error('Error marking order ready:', error);
            this.showNotification('Error updating order. Please try again.', 'error');
        }
    }

    async notifyCustomer(orderId, status) {
        try {
            await fetch(`/api/orders/${orderId}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Error notifying customer:', error);
        }
    }

    handleNewOrderNotification(orderData) {
        // Play notification sound
        this.playNotificationSound();
        
        // Add new order to incoming list
        const newOrder = {
            _id: orderData.orderId,
            orderNumber: orderData.orderId,
            customerInfo: { name: orderData.customerName },
            items: orderData.items,
            total: orderData.total,
            orderType: orderData.orderType,
            status: 'pending',
            createdAt: new Date().toISOString(),
            estimatedPrepTime: 15
        };
        
        this.orders.incoming.unshift(newOrder);
        this.displayOrders('incomingOrders', this.orders.incoming, 'incoming');
        
        // Update notification badge
        this.updateNotificationBadge();
        
        // Show notification
        this.showNotification(`New ${orderData.orderType} order from ${orderData.customerName}`, 'info');
    }

    playNotificationSound() {
        if (this.notificationSound) {
            this.notificationSound.currentTime = 0;
            this.notificationSound.play().catch(e => console.error('Error playing sound:', e));
        }
    }

    updateNotificationBadge() {
        const notificationDot = document.querySelector('.notification-dot');
        if (notificationDot) {
            notificationDot.style.display = this.orders.incoming.length > 0 ? 'block' : 'none';
        }
    }

    loadNotifications() {
        const stored = localStorage.getItem('staff_notifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
        }
    }

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update menu active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`).closest('.menu-item');
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const timestampEl = document.getElementById('currentTime');
        if (timestampEl) {
            timestampEl.textContent = timeString;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async loadInventory() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const products = await response.json();
                this.displayInventory(products);
            }
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    }

    displayInventory(products) {
        const container = document.getElementById('inventoryGrid');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<p>No products found</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="inventory-item">
                <div class="inventory-card">
                    <div class="inventory-header">
                        <h3>${product.name}</h3>
                        <span class="inventory-category">${product.category}</span>
                    </div>
                    <div class="inventory-details">
                        <p><strong>Price:</strong> ₱${product.price.toFixed(2)}</p>
                        <p><strong>Stock:</strong> ${product.stock || 'N/A'}</p>
                        <p><strong>Status:</strong> ${product.inStock ? 'In Stock' : 'Out of Stock'}</p>
                    </div>
                    <div class="inventory-actions">
                        <button class="action-btn" onclick="updateStock('${product._id}')">
                            <i class="fas fa-edit"></i>
                            Update Stock
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('staff_notifications');
            window.location.href = '/auth.html';
        }
    }
}

// Global functions for HTML onclick handlers
function logout() {
    const dashboard = new StaffDashboard();
    dashboard.logout();
}

function openStockModal() {
    alert('Stock update modal would open here');
}

function refreshInventory() {
    const dashboard = new StaffDashboard();
    dashboard.loadInventory();
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StaffDashboard();
});
