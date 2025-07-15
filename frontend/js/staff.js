// Staff Dashboard JavaScript
class StaffDashboard {
    constructor() {
        this.currentUser = null;
        this.currentTime = new Date();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateTime();
        this.loadSampleOrders();
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

    loadSampleOrders() {
        // Load sample orders for demonstration
        const incomingOrders = [
            {
                id: 'ORD001',
                dateTime: '07/13/2025 - 7:15 AM',
                items: 'Cappuccino x2, Croissant x1'
            },
            {
                id: 'ORD002',
                dateTime: '07/13/2025 - 7:18 AM',
                items: 'Americano x1, Muffin x1'
            }
        ];

        const progressOrders = [
            {
                id: 'ORD003',
                dateTime: '07/13/2025 - 7:12 AM',
                items: 'Latte x1, Sandwich x1'
            }
        ];

        const completedOrders = [
            {
                id: 'ORD004',
                dateTime: '07/13/2025 - 7:05 AM',
                items: 'Espresso x2, Bagel x1'
            }
        ];

        this.displayOrders('incomingOrders', incomingOrders, 'incoming');
        this.displayOrders('progressOrders', progressOrders, 'progress');
        this.displayOrders('completedOrders', completedOrders, 'completed');
    }

    displayOrders(containerId, orders, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = orders.map(order => `
            <div class="order-card ${type === 'completed' ? 'completed' : ''}" data-order-id="${order.id}">
                <div class="order-info">
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Date & Time:</strong> ${order.dateTime}</p>
                    <p><strong>Items:</strong> ${order.items}</p>
                </div>
                ${type === 'incoming' ? '<button class="order-action-btn accept-btn">Accept</button>' : ''}
                ${type === 'progress' ? '<button class="order-action-btn ready-btn">Ready</button>' : ''}
            </div>
        `).join('');
    }

    acceptOrder(button) {
        const orderCard = button.closest('.order-card');
        const orderId = orderCard.dataset.orderId;
        
        // Move order from incoming to progress
        const orderInfo = orderCard.querySelector('.order-info').innerHTML;
        
        // Remove from incoming
        orderCard.remove();
        
        // Add to progress
        const progressContainer = document.getElementById('progressOrders');
        const newOrderCard = document.createElement('div');
        newOrderCard.className = 'order-card';
        newOrderCard.dataset.orderId = orderId;
        newOrderCard.innerHTML = `
            <div class="order-info">
                ${orderInfo}
            </div>
            <button class="order-action-btn ready-btn">Ready</button>
        `;
        
        progressContainer.appendChild(newOrderCard);
        
        // Show notification
        this.showNotification('Order accepted and moved to preparation', 'success');
    }

    markOrderReady(button) {
        const orderCard = button.closest('.order-card');
        const orderId = orderCard.dataset.orderId;
        
        // Move order from progress to completed
        const orderInfo = orderCard.querySelector('.order-info').innerHTML;
        
        // Remove from progress
        orderCard.remove();
        
        // Add to completed
        const completedContainer = document.getElementById('completedOrders');
        const newOrderCard = document.createElement('div');
        newOrderCard.className = 'order-card completed';
        newOrderCard.dataset.orderId = orderId;
        newOrderCard.innerHTML = `
            <div class="order-info">
                ${orderInfo}
            </div>
        `;
        
        completedContainer.appendChild(newOrderCard);
        
        // Show notification
        this.showNotification('Order marked as ready and completed', 'success');
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
            background: ${type === 'success' ? '#28a745' : '#007bff'};
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
            const token = localStorage.getItem('token');
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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
                <h3>${product.name}</h3>
                <p>Stock: ${product.stock}</p>
                <p>Price: ₱${product.price}</p>
                <div class="item-actions">
                    <button class="action-btn" onclick="updateStock('${product._id}')">
                        Update Stock
                    </button>
                </div>
            </div>
        `).join('');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
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
