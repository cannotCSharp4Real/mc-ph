// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'sales';
        this.salesChart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.updateTimestamp();
        this.loadData();
        this.startAuthCheck();
        
        // Update timestamp every minute
        setInterval(() => this.updateTimestamp(), 60000);
    }

    startAuthCheck() {
        // Check authentication every 5 minutes
        setInterval(() => {
            this.checkAuthStatus();
        }, 300000);
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.handleUnauthorized();
            return;
        }

        try {
            const response = await fetch('http://localhost:3002/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                this.handleUnauthorized();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.handleUnauthorized();
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('collapsed');
            });
        }

        // Search functionality
        this.setupSearchFilters();
    }

    setupSearchFilters() {
        // User search
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.filterTable('users', e.target.value);
            });
        }

        // Product search
        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            productSearch.addEventListener('input', (e) => {
                this.filterTable('products', e.target.value);
            });
        }

        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filterTableByRole(e.target.value);
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterTableByCategory(e.target.value);
            });
        }
    }

    updateTimestamp() {
        const now = new Date();
        const options = {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        const timestamp = now.toLocaleString('en-US', options);

        // Update all timestamp elements
        const timestampElements = [
            'currentTimestamp',
            'productsTimestamp',
            'usersTimestamp'
        ];

        timestampElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = timestamp;
            }
        });
    }

    initializeCharts() {
        this.createSalesChart();
    }

    createSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Sample data for the chart
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Sales',
                data: [12000, 15000, 18000, 22000, 25000, 28000],
                backgroundColor: 'rgba(212, 165, 116, 0.8)',
                borderColor: 'rgba(212, 165, 116, 1)',
                borderWidth: 2
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        };

        this.salesChart = new Chart(ctx, config);
    }

    updateChart() {
        const period = document.getElementById('chartPeriod').value;
        
        // Sample data for different periods
        const chartData = {
            daily: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                data: [1200, 1500, 1800, 2200, 2500, 2800, 2100]
            },
            monthly: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [12000, 15000, 18000, 22000, 25000, 28000]
            },
            yearly: {
                labels: ['2020', '2021', '2022', '2023', '2024'],
                data: [120000, 150000, 180000, 220000, 250000]
            }
        };

        if (this.salesChart && chartData[period]) {
            this.salesChart.data.labels = chartData[period].labels;
            this.salesChart.data.datasets[0].data = chartData[period].data;
            this.salesChart.update();
        }
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeMenuItem = document.querySelector(`[data-section="${section}"]`).closest('.menu-item');
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // Update breadcrumb
        const breadcrumbSection = document.getElementById('currentSection');
        if (breadcrumbSection) {
            breadcrumbSection.textContent = section.charAt(0).toUpperCase() + section.slice(1);
        }

        this.currentSection = section;
        this.updateTimestamp();
    }

    filterTable(tableType, searchTerm) {
        const tableBody = document.getElementById(tableType + 'TableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(searchTerm.toLowerCase());
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    filterTableByRole(role) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const roleCell = row.cells[2]; // Role column
            if (!role || roleCell.textContent.toLowerCase() === role.toLowerCase()) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filterTableByCategory(category) {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const categoryCell = row.cells[1]; // Category column
            if (!category || categoryCell.textContent.toLowerCase() === category.toLowerCase()) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    loadData() {
        // Simulate loading data
        this.animateNumbers();
    }

    animateNumbers() {
        // Animate the stat numbers
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            const finalValue = stat.textContent.replace(/[₱,]/g, '');
            if (!isNaN(finalValue)) {
                this.animateNumber(stat, 0, parseInt(finalValue), 2000);
            }
        });
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const originalText = element.textContent;
        const isPrice = originalText.includes('₱');

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            const formattedNumber = current.toLocaleString();
            
            element.textContent = isPrice ? `₱${formattedNumber}` : formattedNumber;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Modal functions
    openUserModal() {
        alert('User modal would open here');
        // TODO: Implement user modal
    }

    openProductModal() {
        alert('Product modal would open here');
        // TODO: Implement product modal
    }

    openInventoryModal() {
        alert('Inventory modal would open here');
        // TODO: Implement inventory modal
    }

    // API methods
    async fetchUsers() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3002/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 401) {
                this.handleUnauthorized();
                return [];
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async fetchProducts() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3002/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 401) {
                this.handleUnauthorized();
                return [];
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    async fetchSalesData() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3002/api/sales', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 401) {
                this.handleUnauthorized();
                return {};
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching sales data:', error);
            return {};
        }
    }

    handleUnauthorized() {
        this.showNotification('Session expired. Please login again.', 'warning');
        setTimeout(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            window.location.href = 'auth.html';
        }, 2000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Global functions
function showSection(section) {
    if (window.adminDashboard) {
        window.adminDashboard.showSection(section);
    }
}

function updateChart() {
    if (window.adminDashboard) {
        window.adminDashboard.updateChart();
    }
}

function openUserModal() {
    if (window.adminDashboard) {
        window.adminDashboard.openUserModal();
    }
}

function openProductModal() {
    if (window.adminDashboard) {
        window.adminDashboard.openProductModal();
    }
}

function openInventoryModal() {
    if (window.adminDashboard) {
        window.adminDashboard.openInventoryModal();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('rememberMe');
        window.location.href = 'auth.html';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    if (!token || userRole !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'auth.html';
        return;
    }

    // Update user display
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement && userName) {
        currentUserElement.textContent = userName;
    }

    // Initialize dashboard
    window.adminDashboard = new AdminDashboard();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    }

    .notification.info {
        border-left: 4px solid #17a2b8;
    }

    .notification.success {
        border-left: 4px solid #28a745;
    }

    .notification.warning {
        border-left: 4px solid #ffc107;
    }

    .notification.error {
        border-left: 4px solid #dc3545;
    }

    .notification-content {
        padding: 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-close:hover {
        color: #333;
    }

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
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
