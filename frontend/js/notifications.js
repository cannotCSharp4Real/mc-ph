// Real-time Notifications System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.subscribers = new Map();
        this.initializeNotificationSystem();
    }

    // Initialize notification system
    initializeNotificationSystem() {
        // Create notification container
        this.createNotificationContainer();
        
        // Start listening for order status changes
        this.startOrderStatusMonitoring();
        
        // Request notification permissions
        this.requestNotificationPermission();
    }

    // Create notification container in DOM
    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(container);
    }

    // Request browser notification permission
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    }

    // Start monitoring order status changes
    startOrderStatusMonitoring() {
        // Check for order changes every 2 seconds
        setInterval(() => {
            this.checkOrderStatusChanges();
        }, 2000);
    }

    // Check for order status changes
    checkOrderStatusChanges() {
        const currentOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const lastKnownOrders = JSON.parse(localStorage.getItem('lastKnownOrders')) || [];
        
        // Compare current orders with last known orders
        currentOrders.forEach(currentOrder => {
            const lastKnownOrder = lastKnownOrders.find(o => o.id === currentOrder.id);
            
            if (lastKnownOrder && lastKnownOrder.status !== currentOrder.status) {
                // Status changed - send notification based on user type and status
                this.sendOrderStatusNotification(currentOrder, lastKnownOrder.status);
            } else if (!lastKnownOrder) {
                // New order - only notify staff
                this.sendNewOrderNotification(currentOrder);
            }
        });
        
        // Update last known orders
        localStorage.setItem('lastKnownOrders', JSON.stringify(currentOrders));
    }

    // Send new order notification
    sendNewOrderNotification(order) {
        // Only notify staff about new orders
        if (this.isStaffPage()) {
            const message = `New order received: ${order.id}`;
            const details = `Items: ${order.items.map(item => item.name).join(', ')} | Total: ₱${order.total}`;
            
            this.showNotification('New Order', message, details, 'info');
            this.showBrowserNotification('New Order', message);
        }
    }

    // Send order status notification
    sendOrderStatusNotification(order, previousStatus) {
        const statusMessages = {
            'pending': '⏳ Order is being prepared',
            'in-progress': '👨‍🍳 Order is being prepared',
            'ready': '✅ Order is ready for pickup',
            'completed': '🎉 Order has been completed',
            'cancelled': '❌ Order has been cancelled'
        };
        
        const message = statusMessages[order.status] || `Order status updated to ${order.status}`;
        const details = `Order: ${order.id} | Total: ₱${order.total}`;
        
        // Different notification types based on status
        let type = 'info';
        if (order.status === 'ready') type = 'success';
        if (order.status === 'cancelled') type = 'error';
        
        // Customer notifications - only for in-progress and ready
        if (this.isCustomerPage()) {
            if (order.status === 'in-progress' || order.status === 'ready') {
                this.showNotification('Order Update', message, details, type);
                this.showBrowserNotification('Order Update', message);
            }
        }
        
        // Staff notifications - only for incoming orders (handled in sendNewOrderNotification)
        // Staff doesn't get status update notifications
    }

    // Show in-app notification
    showNotification(title, message, details, type = 'info') {
        const notification = {
            id: Date.now() + Math.random(),
            title,
            message,
            details,
            type,
            timestamp: new Date().toISOString()
        };
        
        this.notifications.push(notification);
        this.renderNotification(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    // Show browser notification
    showBrowserNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/frontend/images/logo.svg',
                badge: '/frontend/images/logo.svg'
            });
        }
    }

    // Render notification in DOM
    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notificationEl = document.createElement('div');
        notificationEl.id = `notification-${notification.id}`;
        notificationEl.style.cssText = `
            background: ${this.getNotificationColor(notification.type)};
            color: white;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            animation: slideIn 0.3s ease;
        `;
        
        notificationEl.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${notification.title}</div>
            <div style="margin-bottom: 5px;">${notification.message}</div>
            <div style="font-size: 12px; opacity: 0.9;">${notification.details}</div>
            <div style="font-size: 10px; opacity: 0.7; margin-top: 5px;">
                ${new Date(notification.timestamp).toLocaleTimeString()}
            </div>
        `;
        
        // Click to dismiss
        notificationEl.addEventListener('click', () => {
            this.removeNotification(notification.id);
        });
        
        container.appendChild(notificationEl);
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Get notification color based on type
    getNotificationColor(type) {
        const colors = {
            'info': '#17a2b8',
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107'
        };
        return colors[type] || colors.info;
    }

    // Remove notification
    removeNotification(id) {
        const notificationEl = document.getElementById(`notification-${id}`);
        if (notificationEl) {
            notificationEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }
        
        // Remove from notifications array
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    // Check if current page is staff page
    isStaffPage() {
        return window.location.pathname.includes('staff.html');
    }

    // Check if current page is customer page
    isCustomerPage() {
        return window.location.pathname.includes('index.html');
    }

    // Subscribe to order updates
    subscribe(callback) {
        const id = Date.now() + Math.random();
        this.subscribers.set(id, callback);
        return id;
    }

    // Unsubscribe from order updates
    unsubscribe(id) {
        this.subscribers.delete(id);
    }

    // Notify all subscribers
    notifySubscribers(data) {
        this.subscribers.forEach(callback => {
            callback(data);
        });
    }
}

// Initialize global notification manager
const notificationManager = new NotificationManager();

// Export for use in other files
window.notificationManager = notificationManager;

// Add slide-out animation
const slideOutStyle = document.createElement('style');
slideOutStyle.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideOutStyle);

console.log('🔔 Real-time notification system initialized');

// Test function to create sample orders and simulate workflow
function testOrderNotifications() {
    console.log('🧪 Testing order notifications...');
    
    // Clear existing orders
    localStorage.removeItem('orders');
    localStorage.removeItem('lastKnownOrders');
    
    // Create a new test order
    const testOrder = {
        id: 'TEST-' + Date.now(),
        customerInfo: {
            name: 'John Doe',
            phone: '123-456-7890',
            email: 'john@example.com'
        },
        items: [
            {
                name: 'Spanish Latte',
                price: 120,
                quantity: 1,
                size: 'regular',
                addons: []
            }
        ],
        subtotal: 120,
        tax: 14.4,
        total: 134.4,
        paymentMethod: 'cash',
        type: 'pickup',
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Save the order
    localStorage.setItem('orders', JSON.stringify([testOrder]));
    
    console.log('✅ Test order created:', testOrder.id);
    
    // Simulate order progression
    let currentOrder = testOrder;
    
    setTimeout(() => {
        console.log('📋 Moving order to in-progress...');
        currentOrder.status = 'in-progress';
        currentOrder.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify([currentOrder]));
    }, 3000);
    
    setTimeout(() => {
        console.log('✅ Moving order to ready...');
        currentOrder.status = 'ready';
        currentOrder.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify([currentOrder]));
    }, 6000);
    
    setTimeout(() => {
        console.log('🎉 Moving order to completed...');
        currentOrder.status = 'completed';
        currentOrder.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify([currentOrder]));
    }, 9000);
    
    console.log('🔔 Watch for notifications! Staff will see new order, customers will see in-progress and ready notifications.');
}

// Call testOrderNotifications() in console to test the notification flow
