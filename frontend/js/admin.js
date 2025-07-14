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

        // Navigation menu items
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Chart period selector
        const chartPeriod = document.getElementById('chartPeriod');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => {
                this.updateChart();
            });
        }

        // Role dropdowns
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('role-dropdown')) {
                const userId = e.target.getAttribute('data-user-id');
                const newRole = e.target.value;
                this.updateUserRole(userId, newRole);
            }
        });

        // Action buttons
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            
            if (action === 'logout') {
                this.logout();
            } else if (action === 'add-user') {
                this.openUserModal();
            } else if (action === 'add-product') {
                this.openProductModal();
            } else if (action === 'delete-user') {
                const userId = e.target.getAttribute('data-user-id');
                this.deleteUser(userId);
            }
        });

        // Search functionality
        this.setupSearchFilters();
    }

    setupSearchFilters() {
        // User search
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.filterUserTable(e.target.value);
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
                this.filterUsersByRole(e.target.value);
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
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Charts will not be displayed.');
            return;
        }
        
        this.createSalesChart();
    }

    createSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx || typeof Chart === 'undefined') return;

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

        try {
            this.salesChart = new Chart(ctx, config);
        } catch (error) {
            console.error('Error creating chart:', error);
            // Show a placeholder if chart creation fails
            ctx.parentElement.innerHTML = '<div class="chart-placeholder">Chart could not be loaded</div>';
        }
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

        if (this.salesChart && chartData[period] && typeof Chart !== 'undefined') {
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
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New User</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addUserForm">
                        <div class="form-group">
                            <label for="newUserEmail">Email:</label>
                            <input type="email" id="newUserEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserRole">Role:</label>
                            <select id="newUserRole" required>
                                <option value="customer">Customer</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="newUserPassword">Password:</label>
                            <input type="password" id="newUserPassword" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="secondary-btn" onclick="closeModal()">Cancel</button>
                    <button class="primary-btn" onclick="createUser()">Create User</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on email field
        setTimeout(() => {
            document.getElementById('newUserEmail').focus();
        }, 100);
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    async createUser() {
        const email = document.getElementById('newUserEmail').value;
        const role = document.getElementById('newUserRole').value;
        const password = document.getElementById('newUserPassword').value;
        
        if (!email || !role || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3002/api/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, role, password })
            });
            
            if (response.ok) {
                const newUser = await response.json();
                
                // Add user to table
                const tableBody = document.getElementById('usersTableBody');
                const userCount = tableBody.children.length + 1;
                const userId = String(userCount).padStart(2, '0');
                const currentDate = new Date().toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                });
                
                const row = document.createElement('tr');
                row.setAttribute('data-user-id', newUser._id || userId);
                row.innerHTML = `
                    <td>${userId}</td>
                    <td>${email}</td>
                    <td>${currentDate}</td>
                    <td>
                        <select class="role-dropdown" onchange="updateUserRole('${newUser._id || userId}', this.value)">
                            <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="staff" ${role === 'staff' ? 'selected' : ''}>Staff</option>
                            <option value="customer" ${role === 'customer' ? 'selected' : ''}>Customer</option>
                        </select>
                    </td>
                    <td>
                        <button class="delete-btn" onclick="deleteUser('${newUser._id || userId}')">Delete</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
                
                if (window.adminDashboard) {
                    window.adminDashboard.showNotification('User created successfully', 'success');
                }
                
                this.closeModal();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Network error. Please try again.');
        }
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

    // User Management Functions
    async updateUserRole(userId, newRole) {
        const dropdown = document.querySelector(`tr[data-user-id="${userId}"] .role-dropdown`);
        const originalRole = dropdown.value;
        
        // Add loading state
        dropdown.classList.add('updating');
        dropdown.disabled = true;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3002/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                this.showNotification(`User role updated to ${newRole}`, 'success');
                
                // Update visual feedback
                dropdown.setAttribute('value', newRole);
                dropdown.value = newRole;
                
                // Log the change
                console.log(`User ${userId} role updated from ${originalRole} to ${newRole}`);
            } else {
                const error = await response.json();
                this.showNotification(`Failed to update role: ${error.message}`, 'error');
                
                // Revert dropdown to original value
                dropdown.value = originalRole;
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            this.showNotification('Network error. Please try again.', 'error');
            
            // Revert dropdown to original value
            dropdown.value = originalRole;
        } finally {
            // Remove loading state
            dropdown.classList.remove('updating');
            dropdown.disabled = false;
        }
    }

    async deleteUser(userId) {
        // Get user email for confirmation
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        const userEmail = userRow.querySelector('td:nth-child(2)').textContent;
        
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete user "${userEmail}"?\n\nThis action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3002/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove user row from table
                userRow.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    userRow.remove();
                }, 300);
                
                this.showNotification(`User ${userEmail} deleted successfully`, 'success');
                
                // Update user count if displayed
                this.updateUserCount();
            } else {
                const error = await response.json();
                this.showNotification(`Failed to delete user: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    updateUserCount() {
        const userRows = document.querySelectorAll('#usersTableBody tr');
        console.log(`Total users: ${userRows.length}`);
        
        // You can add logic here to update any user count displays
        // For example, update a statistics card if it exists
    }

    // Enhanced search functionality for users
    filterUserTable(searchTerm) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const userId = row.cells[0].textContent;
            const email = row.cells[1].textContent;
            const role = row.cells[3].querySelector('select').value;
            
            const searchText = `${userId} ${email} ${role}`.toLowerCase();
            const shouldShow = searchText.includes(searchTerm.toLowerCase());
            
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    // Enhanced role filter functionality
    filterUsersByRole(selectedRole) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const roleDropdown = row.querySelector('.role-dropdown');
            const userRole = roleDropdown.value;
            
            const shouldShow = !selectedRole || userRole === selectedRole;
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    // Load users from API
    async loadUsers() {
        try {
            const users = await this.fetchUsers();
            this.renderUsersTable(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Failed to load users', 'error');
        }
    }

    renderUsersTable(users) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        users.forEach((user, index) => {
            const userId = String(index + 1).padStart(2, '0');
            const createdDate = new Date(user.createdAt).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });

            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user._id || userId);
            row.innerHTML = `
                <td>${userId}</td>
                <td>${user.email}</td>
                <td>${createdDate}</td>
                <td>
                    <select class="role-dropdown" onchange="updateUserRole('${user._id || userId}', this.value)">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                        <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                    </select>
                </td>
                <td>
                    <button class="delete-btn" onclick="deleteUser('${user._id || userId}')">Delete</button>
                </td>
            `;
            
            tableBody.appendChild(row);
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

// Global functions for user management
function updateUserRole(userId, newRole) {
    if (window.adminDashboard) {
        window.adminDashboard.updateUserRole(userId, newRole);
    }
}

function deleteUser(userId) {
    if (window.adminDashboard) {
        window.adminDashboard.deleteUser(userId);
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
