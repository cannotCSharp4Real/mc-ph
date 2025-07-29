// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuth()) {
        return; // Exit if not authenticated
    }
    
    // Setup logout button immediately
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✅ Logout button event listener attached');
    } else {
        console.log('❌ Logout button not found');
    }
    
    // Initialize the dashboard
    initializeDashboard();
    updateDateTime();
    loadSalesData();
    initializeChart();
    
    // Update time every second
    setInterval(updateDateTime, 1000);
});

// Initialize dashboard functionality
function initializeDashboard() {
    // Force create sales data from completed orders
    forceSalesDataCreation();
    
    // Navigation functionality
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.parentElement.classList.add('active');
            
            // Hide all content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const sectionId = this.getAttribute('data-section') + '-section';
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
                
                // Initialize section-specific functionality
                if (sectionId === 'products-section') {
                    initializeProductManagement();
                } else if (sectionId === 'users-section') {
                    initializeUserManagement();
                }
            }
        });
    });
    
    // Chart period filter
    const chartPeriodSelect = document.getElementById('chartPeriod');
    if (chartPeriodSelect) {
        chartPeriodSelect.addEventListener('change', function() {
            updateChart(this.value);
        });
    }
    
    // Initialize product management if on products tab
    if (document.getElementById('products-section').classList.contains('active')) {
        initializeProductManagement();
    }
    
    // Modal close handlers
    window.addEventListener('click', function(event) {
        const productModal = document.getElementById('productModal');
        
        if (event.target === productModal) {
            closeProductModal();
        }
    });
}

// Update current date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const dateTimeString = now.toLocaleString('en-US', options);
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

// Load sales data
async function loadSalesData() {
    console.log('📊 Loading sales data...');
    
    // First, convert any existing completed orders to sales records
    const convertedRecords = convertCompletedOrdersToSales();
    console.log('🔄 Converted records:', convertedRecords.length);
    
    // Ensure we have some sales data for testing
    if (convertedRecords.length === 0) {
        console.log('⚠️ No sales records after conversion, creating test data...');
        ensureSalesData();
    }
    
    try {
        // Try to fetch from API first
        const summaryResponse = await apiRequest('/sales/summary');
        const productsResponse = await apiRequest('/sales/products-stats');
        
        const salesData = {
            today: summaryResponse.today,
            month: summaryResponse.month,
            total: summaryResponse.total,
            mostBought: productsResponse.mostBought,
            leastBought: productsResponse.leastBought
        };
        
        // Update sales summary
        updateSalesSummary(salesData);
        
        // Update most/least bought products
        updateProductsInfo(salesData);
        
        // Load chart data
        loadChartData('daily');
        
    } catch (error) {
        console.error('Error loading sales data from API:', error);
        console.log('📱 Using localStorage data as fallback...');
        // Use localStorage data as fallback
        loadSalesDataFromLocalStorage();
    }
}

// Load sales data from localStorage
function loadSalesDataFromLocalStorage() {
    // First, let's check what we have in localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    
    console.log('� DIAGNOSTIC INFO:');
    console.log('📦 Total orders in localStorage:', orders.length);
    console.log('✅ Completed orders:', orders.filter(o => o.status === 'completed').length);
    console.log('📊 Sales records in localStorage:', salesRecords.length);
    
    // Force conversion of completed orders to sales
    const updatedSalesRecords = convertCompletedOrdersToSales();
    
    console.log('📈 After conversion - Sales records:', updatedSalesRecords.length);
    console.log('📊 Raw sales records:', updatedSalesRecords);
    
    if (updatedSalesRecords.length === 0) {
        console.log('⚠️ No sales records found after conversion, creating test data...');
        ensureSalesData();
        
        // Try again after creating test data
        const finalRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
        if (finalRecords.length === 0) {
            console.log('❌ Still no sales records after ensureSalesData');
            displayFallbackData();
            return;
        }
        
        console.log('✅ Now processing', finalRecords.length, 'sales records');
        // Process the new records
        processSalesRecords(finalRecords);
        return;
    }
    
    // Process existing records
    processSalesRecords(updatedSalesRecords);
}

// Process sales records and update display
function processSalesRecords(salesRecords) {
    // Calculate sales summary
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let todaySales = 0;
    let monthSales = 0;
    let totalSales = 0;
    const productStats = {};
    
    console.log('📊 Processing sales records:', salesRecords.length);
    
    salesRecords.forEach(record => {
        const saleDate = new Date(record.saleDate);
        const saleAmount = record.total;
        
        console.log('💰 Processing sale:', { date: saleDate.toISOString(), amount: saleAmount });
        
        // Calculate totals
        totalSales += saleAmount;
        
        if (saleDate >= todayStart) {
            todaySales += saleAmount;
            console.log('📅 Today\'s sale:', saleAmount);
        }
        
        if (saleDate >= monthStart) {
            monthSales += saleAmount;
            console.log('🗓️ Monthly sale:', saleAmount);
        }
        
        // Calculate product statistics
        record.items.forEach(item => {
            const productName = item.productName || item.name;
            if (!productStats[productName]) {
                productStats[productName] = {
                    name: productName,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }
            productStats[productName].totalQuantity += item.quantity;
            productStats[productName].totalRevenue += item.totalPrice || (item.price * item.quantity);
        });
    });
    
    // Find most and least bought products
    const productArray = Object.values(productStats);
    productArray.sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    const mostBought = productArray.length > 0 ? productArray[0].name : 'No data';
    const leastBought = productArray.length > 0 ? productArray[productArray.length - 1].name : 'No data';
    
    const salesData = {
        today: todaySales,
        month: monthSales,
        total: totalSales,
        mostBought: mostBought,
        leastBought: leastBought
    };
    
    console.log('📊 Calculated sales data:', salesData);
    console.log('📦 Product statistics:', productArray);
    
    // Update sales summary
    updateSalesSummary(salesData);
    
    // Update most/least bought products
    updateProductsInfo(salesData);
    
    // Load chart data from localStorage
    loadChartDataFromLocalStorage('daily');
}

// Load chart data from localStorage
function loadChartDataFromLocalStorage(period) {
    const salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    
    if (salesRecords.length === 0) {
        initializeChart();
        return;
    }
    
    let chartData = [];
    
    if (period === 'daily') {
        // Generate data for last 7 days
        const today = new Date();
        const dailyData = {};
        
        // Initialize with zeros
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = 0;
        }
        
        // Aggregate sales by date
        salesRecords.forEach(record => {
            const saleDate = new Date(record.saleDate);
            const dateStr = saleDate.toISOString().split('T')[0];
            
            if (dailyData.hasOwnProperty(dateStr)) {
                dailyData[dateStr] += record.total;
            }
        });
        
        // Convert to chart format
        chartData = Object.keys(dailyData).map(date => ({
            date: date,
            amount: dailyData[date]
        }));
    } else if (period === 'monthly') {
        // Generate data for last 6 months
        const today = new Date();
        const monthlyData = {};
        
        // Initialize with zeros
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[dateStr] = 0;
        }
        
        // Aggregate sales by month
        salesRecords.forEach(record => {
            const saleDate = new Date(record.saleDate);
            const dateStr = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData.hasOwnProperty(dateStr)) {
                monthlyData[dateStr] += record.total;
            }
        });
        
        // Convert to chart format
        chartData = Object.keys(monthlyData).map(date => ({
            date: date,
            amount: monthlyData[date]
        }));
    } else if (period === 'yearly') {
        // Generate data for last 3 years
        const currentYear = new Date().getFullYear();
        const yearlyData = {};
        
        // Initialize with zeros
        for (let i = 2; i >= 0; i--) {
            const year = currentYear - i;
            yearlyData[year.toString()] = 0;
        }
        
        // Aggregate sales by year
        salesRecords.forEach(record => {
            const saleDate = new Date(record.saleDate);
            const year = saleDate.getFullYear().toString();
            
            if (yearlyData.hasOwnProperty(year)) {
                yearlyData[year] += record.total;
            }
        });
        
        // Convert to chart format
        chartData = Object.keys(yearlyData).map(year => ({
            date: year,
            amount: yearlyData[year]
        }));
    }
    
    updateChartWithData(chartData, period);
}

// Load chart data from API
async function loadChartData(period) {
    try {
        const chartData = await apiRequest(`/sales/chart/${period}`);
        updateChartWithData(chartData, period);
    } catch (error) {
        console.error('Error loading chart data from API:', error);
        // Use localStorage data as fallback
        loadChartDataFromLocalStorage(period);
    }
}

// Update chart with API data
function updateChartWithData(data, period) {
    if (!salesChart) {
        initializeChart();
    }
    
    let labels = [];
    let values = [];
    
    if (period === 'daily') {
        // For daily data, show last 7 days
        const today = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay()];
            
            labels.push(dayName);
            
            const dayData = data.find(item => item.date === dateStr);
            values.push(dayData ? dayData.amount : 0);
        }
    } else if (period === 'monthly') {
        // For monthly data, show last 6 months
        const today = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = months[date.getMonth()];
            
            labels.push(monthName);
            
            const monthData = data.find(item => item.date === dateStr);
            values.push(monthData ? monthData.amount : 0);
        }
    } else if (period === 'yearly') {
        // For yearly data, show last 3 years
        const currentYear = new Date().getFullYear();
        
        for (let i = 2; i >= 0; i--) {
            const year = currentYear - i;
            labels.push(year.toString());
            
            const yearData = data.find(item => item.date === year.toString());
            values.push(yearData ? yearData.amount : 0);
        }
    }
    
    if (salesChart) {
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = values;
        salesChart.update('active');
    }
}

// Update sales summary cards
function updateSalesSummary(data) {
    const todayElement = document.getElementById('todaySales');
    const monthElement = document.getElementById('monthSales');
    const totalElement = document.getElementById('totalSales');
    
    console.log('📊 Updating sales summary:', data);
    
    if (todayElement) {
        const todayValue = data.today || 0;
        console.log('Today sales:', todayValue);
        if (isNaN(todayValue)) {
            todayElement.textContent = '0';
        } else {
            animateNumber(todayElement, todayValue);
        }
    }
    if (monthElement) {
        const monthValue = data.month || 0;
        console.log('Month sales:', monthValue);
        if (isNaN(monthValue)) {
            monthElement.textContent = '0';
        } else {
            animateNumber(monthElement, monthValue);
        }
    }
    if (totalElement) {
        const totalValue = data.total || 0;
        console.log('Total sales:', totalValue);
        if (isNaN(totalValue)) {
            totalElement.textContent = '0';
        } else {
            animateNumber(totalElement, totalValue);
        }
    }
}

// Update products info
function updateProductsInfo(data) {
    const mostBoughtElement = document.getElementById('mostBought');
    const leastBoughtElement = document.getElementById('leastBought');
    
    console.log('📦 Updating products info:', data);
    
    if (mostBoughtElement) {
        const mostBought = data.mostBought || 'No data';
        console.log('Most bought:', mostBought);
        mostBoughtElement.textContent = mostBought;
    }
    if (leastBoughtElement) {
        const leastBought = data.leastBought || 'No data';
        console.log('Least bought:', leastBought);
        leastBoughtElement.textContent = leastBought;
    }
}

// Display fallback data when API fails
function displayFallbackData() {
    const fallbackData = {
        today: 12500,
        month: 98750,
        total: 654320,
        mostBought: 'Spanish Latte',
        leastBought: 'Americano'
    };
    
    updateSalesSummary(fallbackData);
    updateProductsInfo(fallbackData);
}

// Animate number counting
function animateNumber(element, targetValue) {
    const duration = 1000; // 1 second
    const startValue = 0;
    const increment = targetValue / (duration / 16); // 60 FPS
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.floor(currentValue).toLocaleString();
    }, 16);
}

// Initialize chart
let salesChart = null;

function initializeChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales (₱)',
                data: [12000, 15000, 18000, 14000, 16000, 20000, 15420],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
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
    });
}

// Update chart based on period
function updateChart(period) {
    loadChartData(period);
}

// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('🚪 Logging out admin user...');
        
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
}

// API helper functions
async function apiRequest(endpoint, options = {}) {
    const baseUrl = '/api';
    const url = `${baseUrl}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('authToken');
    // Check both possible user storage keys for compatibility
    const userData = localStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user) {
        window.location.href = 'auth.html';
        return false;
    }
    
    try {
        if (user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'auth.html';
        return false;
    }
}

// Error handling for chart initialization
window.addEventListener('error', function(e) {
    console.error('Dashboard error:', e.error);
    
    // Show user-friendly error message
    if (e.error.message.includes('Chart')) {
        const chartContainer = document.querySelector('.chart-area');
        if (chartContainer) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Chart could not be loaded. Please refresh the page.</p>';
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + L for logout
    if (e.altKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
    
    // Alt + 1, 2, 3 for navigation
    if (e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const navLinks = document.querySelectorAll('.nav-link');
        const index = parseInt(e.key) - 1;
        if (navLinks[index]) {
            navLinks[index].click();
        }
    }
});

// Touch/mobile support
function addTouchSupport() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('touchstart', function() {
            this.style.backgroundColor = '#2c3e50';
        });
        
        link.addEventListener('touchend', function() {
            setTimeout(() => {
                if (!this.parentElement.classList.contains('active')) {
                    this.style.backgroundColor = '';
                }
            }, 100);
        });
    });
}

// Initialize touch support on mobile devices
if ('ontouchstart' in window) {
    addTouchSupport();
}

// Product Management Variables
let currentProducts = [];
let currentCategory = 'drinks';
let editingProductId = null;

// User Management Variables
let currentUsers = [];
let editingUserId = null;
let currentRoleFilter = '';

// Product Management Functions
function initializeProductManagement() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            tabButtons.forEach(tab => tab.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Get category and load products
            currentCategory = this.getAttribute('data-category');
            loadProducts(currentCategory);
        });
    });
    
    // Add Product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Modal close buttons
    const closeProductModalBtn = document.getElementById('closeProductModalBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', closeProductModal);
    }
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', closeProductModal);
    }
    
    // Add size button
    const addSizeBtn = document.getElementById('addSizeBtn');
    if (addSizeBtn) {
        addSizeBtn.addEventListener('click', () => addSizePrice());
    }
    
    // Category select change
    const categorySelect = document.getElementById('productCategorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            showCategoryFields(this.value);
        });
    }
    
    // Product form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Load initial products
    loadProducts(currentCategory);
}

// Load products from API
async function loadProducts(category = 'drinks') {
    try {
        const response = await apiRequest(`/products?category=${category}`);
        currentProducts = response; // No need to filter again since API already filters
        renderProducts(currentProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        renderProducts([]);
    }
}

// Render products in the grid
function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-coffee"></i>
                <p>No products found in this category.</p>
                <button class="primary-btn add-first-product">
                    <i class="fas fa-plus"></i>
                    Add First Product
                </button>
            </div>
        `;
        
        // Add event listener for the "Add First Product" button
        const addFirstBtn = productsGrid.querySelector('.add-first-product');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', openAddProductModal);
        }
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || 'No description'}</p>
                
                ${product.category === 'drinks' ? 
                    `<div class="product-sizes">
                        ${product.sizes ? product.sizes.map(size => 
                            `<div class="size-item">
                                <span>${size.name}</span>
                                <span>₱${size.price}</span>
                            </div>`
                        ).join('') : ''}
                    </div>` :
                    `<div class="product-price">₱${product.price}</div>`
                }
                
                <span class="product-status ${product.inStock ? 'status-in-stock' : 'status-out-of-stock'}">
                    ${product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
            </div>
            
            <div class="product-actions">
                <button class="action-btn edit-btn" data-product-id="${product._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" data-product-id="${product._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for edit and delete buttons
    productsGrid.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            editProduct(productId);
        });
    });
    
    productsGrid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            deleteProduct(productId);
        });
    });
}

// Open add product modal
function openAddProductModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('submitBtnText').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productCategorySelect').value = currentCategory;
    showCategoryFields(currentCategory);
    document.getElementById('productModal').style.display = 'block';
}

// Edit product
function editProduct(productId) {
    const product = currentProducts.find(p => p._id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('submitBtnText').textContent = 'Update Product';
    
    // Fill form fields
    document.getElementById('productCategorySelect').value = product.category;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productInStock').checked = product.inStock;
    
    // Handle category-specific fields
    showCategoryFields(product.category);
    
    if (product.category === 'drinks' && product.sizes) {
        const container = document.querySelector('.size-price-container');
        container.innerHTML = '';
        product.sizes.forEach(size => {
            addSizePrice(size.size, size.price);
        });
    } else if (product.category === 'food') {
        document.getElementById('foodPrice').value = product.price;
    } else if (product.category === 'add-ons') {
        document.getElementById('addonPrice').value = product.price;
    }
    
    document.getElementById('productModal').style.display = 'block';
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await apiRequest(`/products/${productId}`, { method: 'DELETE' });
        loadProducts(currentCategory);
        showNotification('Product deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product. Please try again.', 'error');
    }
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        inStock: formData.get('inStock') === 'on'
    };
    
    // Debug: Check what's in the form
    console.log('Form data name:', formData.get('name'));
    console.log('Form data description:', formData.get('description'));
    console.log('Form data category:', formData.get('category'));
    console.log('Form data price:', formData.get('price'));
    console.log('Add-on price input value:', document.getElementById('addonPrice') ? document.getElementById('addonPrice').value : 'NOT FOUND');
    console.log('Food price input value:', document.getElementById('foodPrice') ? document.getElementById('foodPrice').value : 'NOT FOUND');
    
    // Handle category-specific data
    if (productData.category === 'drinks') {
        productData.sizes = getSizesFromForm();
    } else if (productData.category === 'food') {
        productData.price = parseFloat(formData.get('price') || document.getElementById('foodPrice').value);
    } else if (productData.category === 'add-ons') {
        const addonPriceInput = document.getElementById('addonPrice');
        const priceValue = formData.get('price') || (addonPriceInput ? addonPriceInput.value : '');
        console.log('Addon price calculation - FormData:', formData.get('price'), 'Input value:', addonPriceInput ? addonPriceInput.value : 'NULL', 'Final value:', priceValue);
        productData.price = parseFloat(priceValue);
    }
    
    console.log('Submitting product data:', productData);
    
    try {
        const method = editingProductId ? 'PUT' : 'POST';
        const url = editingProductId ? `/products/${editingProductId}` : '/products';
        
        await apiRequest(url, {
            method,
            body: JSON.stringify(productData)
        });
        
        closeProductModal();
        loadProducts(currentCategory);
        showNotification(`Product ${editingProductId ? 'updated' : 'added'} successfully!`, 'success');
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product. Please try again.', 'error');
    }
}

// Show category-specific fields
function showCategoryFields(category) {
    const allFields = document.querySelectorAll('.category-fields');
    allFields.forEach(field => field.classList.remove('active'));
    
    const selectedField = document.getElementById(`${category}Fields`);
    if (selectedField) {
        selectedField.classList.add('active');
    }
}

// Get sizes from form
function getSizesFromForm() {
    const sizeItems = document.querySelectorAll('.size-price-item');
    const sizes = [];
    
    sizeItems.forEach(item => {
        const sizeInput = item.querySelector('.size-input');
        const priceInput = item.querySelector('.price-input');
        
        if (sizeInput && priceInput && sizeInput.value && priceInput.value) {
            sizes.push({
                size: sizeInput.value,
                price: parseFloat(priceInput.value)
            });
        }
    });
    
    return sizes;
}

// Add size-price input
function addSizePrice(sizeName = '', price = '') {
    const container = document.querySelector('.size-price-container');
    const sizeItem = document.createElement('div');
    sizeItem.className = 'size-price-item';
    sizeItem.innerHTML = `
        <input type="text" placeholder="Size (e.g., Small)" class="size-input" value="${sizeName}">
        <input type="number" placeholder="Price" class="price-input" min="0" step="0.01" value="${price}">
        <button type="button" class="remove-size-btn" data-remove-size>
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(sizeItem);
    
    // Add event listener to the remove button
    const removeBtn = sizeItem.querySelector('.remove-size-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removeSizePrice(this);
        });
    }
}

// Remove size-price input
function removeSizePrice(button) {
    const item = button.closest('.size-price-item');
    if (item) {
        item.remove();
    }
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    editingProductId = null;
    document.getElementById('productForm').reset();
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 4px;
        z-index: 3000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// User Management Functions
function initializeUserManagement() {
    // Add User button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', openAddUserModal);
    }
    
    // User modal close buttons
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', closeUserModal);
    }
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', closeUserModal);
    }
    
    // User form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Role filter
    const roleFilter = document.getElementById('userRoleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            currentRoleFilter = this.value;
            loadUsers();
        });
    }
    
    // Load initial users
    loadUsers();
}

// Load users from API
async function loadUsers() {
    try {
        const response = await apiRequest('/users');
        currentUsers = response;
        
        // Apply role filter if set
        let filteredUsers = currentUsers;
        if (currentRoleFilter) {
            filteredUsers = currentUsers.filter(user => user.role === currentRoleFilter);
        }
        
        renderUsers(filteredUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        renderUsers([]);
    }
}

// Render users in the table
function renderUsers(users) {
    const usersTableBody = document.getElementById('usersTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');
    
    if (!usersTableBody) return;
    
    if (users.length === 0) {
        usersTableBody.innerHTML = '';
        noUsersMessage.style.display = 'block';
        return;
    }
    
    noUsersMessage.style.display = 'none';
    
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>#${user._id.slice(-6)}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <select class="role-dropdown" data-user-id="${user._id}" data-current-role="${user.role}">
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                    <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                </select>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="user-actions">
                    <button class="action-btn user-edit-btn" data-user-id="${user._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn user-delete-btn" data-user-id="${user._id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners for role dropdowns
    usersTableBody.querySelectorAll('.role-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const userId = this.getAttribute('data-user-id');
            const currentRole = this.getAttribute('data-current-role');
            const newRole = this.value;
            
            if (newRole !== currentRole) {
                updateUserRole(userId, newRole);
            }
        });
    });
    
    // Add event listeners for edit buttons
    usersTableBody.querySelectorAll('.user-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            editUser(userId);
        });
    });
    
    // Add event listeners for delete buttons
    usersTableBody.querySelectorAll('.user-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
}

// Open add user modal
function openAddUserModal() {
    editingUserId = null;
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userSubmitBtnText').textContent = 'Add User';
    document.getElementById('userForm').reset();
    
    // Show password field for new users
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').required = true;
    
    document.getElementById('userModal').style.display = 'block';
}

// Edit user
function editUser(userId) {
    const user = currentUsers.find(u => u._id === userId);
    if (!user) return;
    
    editingUserId = userId;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userSubmitBtnText').textContent = 'Update User';
    
    // Split name into firstName and lastName
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' '); // Handle multiple last names
    
    // Fill form fields
    document.getElementById('userFirstName').value = firstName;
    document.getElementById('userLastName').value = lastName;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userRole').value = user.role;
    
    // Hide password field for editing
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('userPassword').required = false;
    
    document.getElementById('userModal').style.display = 'block';
}

// Delete user
async function deleteUser(userId) {
    const user = currentUsers.find(u => u._id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return;
    
    try {
        await apiRequest(`/users/${userId}`, { method: 'DELETE' });
        loadUsers();
        showNotification('User deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user. Please try again.', 'error');
    }
}

// Update user role
async function updateUserRole(userId, newRole) {
    try {
        await apiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });
        
        // Update the current users array
        const userIndex = currentUsers.findIndex(u => u._id === userId);
        if (userIndex !== -1) {
            currentUsers[userIndex].role = newRole;
        }
        
        showNotification('User role updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating user role:', error);
        showNotification('Error updating user role. Please try again.', 'error');
        
        // Revert the dropdown selection
        const dropdown = document.querySelector(`[data-user-id="${userId}"]`);
        if (dropdown) {
            dropdown.value = dropdown.getAttribute('data-current-role');
        }
    }
}

// Handle user form submission
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        role: formData.get('role')
    };
    
    // Add password for new users
    if (!editingUserId) {
        userData.password = formData.get('password');
    }
    
    console.log('Submitting user data:', userData);
    
    try {
        const method = editingUserId ? 'PUT' : 'POST';
        const url = editingUserId ? `/users/${editingUserId}` : '/users';
        
        await apiRequest(url, {
            method,
            body: JSON.stringify(userData)
        });
        
        closeUserModal();
        loadUsers();
        showNotification(`User ${editingUserId ? 'updated' : 'created'} successfully!`, 'success');
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error saving user. Please try again.', 'error');
    }
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    editingUserId = null;
    document.getElementById('userForm').reset();
}

// Generate sample sales data for testing
function generateSampleSalesData() {
    const sampleProducts = [
        { name: 'Spanish Latte', price: 120, category: 'drinks' },
        { name: 'Americano', price: 80, category: 'drinks' },
        { name: 'Cappuccino', price: 110, category: 'drinks' },
        { name: 'Peanut Butter Crunch', price: 130, category: 'food' },
        { name: 'Plain Chocolate', price: 145, category: 'food' },
        { name: 'Iced Coffee', price: 90, category: 'drinks' }
    ];
    
    const salesRecords = [];
    const today = new Date();
    
    // Generate sales for the last 30 days
    for (let i = 0; i < 30; i++) {
        const saleDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const ordersPerDay = Math.floor(Math.random() * 15) + 5; // 5-20 orders per day
        
        for (let j = 0; j < ordersPerDay; j++) {
            const orderItems = [];
            const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
            
            for (let k = 0; k < itemCount; k++) {
                const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                
                orderItems.push({
                    productId: product.name.toLowerCase().replace(/\s+/g, '-'),
                    productName: product.name,
                    name: product.name,
                    quantity: quantity,
                    price: product.price,
                    unitPrice: product.price,
                    totalPrice: product.price * quantity,
                    category: product.category,
                    size: 'regular',
                    addons: []
                });
            }
            
            const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
            const tax = subtotal * 0.12;
            const total = subtotal + tax;
            
            const saleRecord = {
                id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderNumber: `CF${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                customerId: 'guest',
                customerInfo: { name: 'Guest Customer' },
                staffId: 'staff-001',
                staffName: 'Staff User',
                items: orderItems,
                subtotal: subtotal,
                tax: tax,
                discount: 0,
                tip: 0,
                total: total,
                paymentMethod: ['cash', 'card', 'gcash'][Math.floor(Math.random() * 3)],
                paymentId: null,
                orderType: ['pickup', 'delivery'][Math.floor(Math.random() * 2)],
                saleDate: saleDate.toISOString(),
                shift: determineShiftForDate(saleDate),
                location: 'main-store',
                promotions: [],
                loyaltyPointsUsed: 0,
                loyaltyPointsEarned: Math.floor(total * 0.1),
                refunded: false,
                refundDate: null,
                refundAmount: 0,
                refundReason: null,
                notes: '',
                createdAt: saleDate.toISOString(),
                updatedAt: saleDate.toISOString()
            };
            
            salesRecords.push(saleRecord);
        }
    }
    
    localStorage.setItem('salesRecords', JSON.stringify(salesRecords));
    console.log(`✅ Generated ${salesRecords.length} sample sales records`);
    
    // Reload sales data to reflect changes
    loadSalesData();
}

function determineShiftForDate(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

// Function to create test sales data if none exist
function ensureSalesData() {
    const salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    
    if (salesRecords.length === 0) {
        console.log('📊 No sales records found, creating test data...');
        
        // Create some test sales records
        const testSales = [
            {
                id: 'SALE-1',
                orderId: 'ORD-1',
                items: [
                    { productName: 'Spanish Latte', quantity: 2, price: 120, totalPrice: 240 },
                    { productName: 'Peanut Butter Crunch', quantity: 1, price: 130, totalPrice: 130 }
                ],
                total: 370,
                saleDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                id: 'SALE-2',
                orderId: 'ORD-2',
                items: [
                    { productName: 'Americano', quantity: 1, price: 80, totalPrice: 80 }
                ],
                total: 80,
                saleDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SALE-3',
                orderId: 'ORD-3',
                items: [
                    { productName: 'Spanish Latte', quantity: 1, price: 120, totalPrice: 120 },
                    { productName: 'Plain Chocolate', quantity: 1, price: 145, totalPrice: 145 }
                ],
                total: 265,
                saleDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('salesRecords', JSON.stringify(testSales));
        console.log('✅ Test sales data created:', testSales);
    }
}

// Clear localStorage for testing (remove this in production)
function clearSalesData() {
    localStorage.removeItem('salesRecords');
    console.log('🗑️ Sales data cleared');
}

// Call this to test: clearSalesData(); then refresh page
// clearSalesData();

// Test function to create and complete orders
function testSalesFlow() {
    console.log('🧪 Starting sales flow test...');
    
    // Clear existing data
    localStorage.removeItem('salesRecords');
    localStorage.removeItem('orders');
    
    // Create a test order
    const testOrder = {
        id: 'TEST-' + Date.now(),
        customerInfo: {
            name: 'Test Customer',
            phone: '123-456-7890',
            email: 'test@example.com'
        },
        items: [
            {
                name: 'Spanish Latte',
                price: 120,
                quantity: 2,
                size: 'regular',
                addons: []
            },
            {
                name: 'Croissant',
                price: 85,
                quantity: 1,
                size: 'regular',
                addons: []
            }
        ],
        subtotal: 325,
        tax: 39,
        total: 364,
        paymentMethod: 'cash',
        type: 'pickup',
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Save the order
    localStorage.setItem('orders', JSON.stringify([testOrder]));
    
    // Simulate completing the order (what staff would do)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[0];
    order.status = 'completed';
    
    // Create sales record
    const saleRecord = {
        id: `SALE-${Date.now()}`,
        orderId: order.id,
        items: order.items.map(item => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity
        })),
        total: order.total,
        saleDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    // Save the sales record
    localStorage.setItem('salesRecords', JSON.stringify([saleRecord]));
    localStorage.setItem('orders', JSON.stringify(orders));
    
    console.log('✅ Test order completed:', saleRecord);
    
    // Refresh the dashboard
    loadSalesData();
}

// Call testSalesFlow() in console to test the complete flow

// Demo function to show complete sales flow
function demoSalesFlow() {
    console.log('🎬 Starting sales demo...');
    
    // Step 1: Clear existing data
    localStorage.removeItem('salesRecords');
    localStorage.removeItem('orders');
    console.log('1️⃣ Cleared existing data');
    
    // Step 2: Create realistic sales data for today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const demoSales = [
        {
            id: 'DEMO-SALE-1',
            orderId: 'DEMO-ORD-1',
            items: [
                { productName: 'Spanish Latte', quantity: 2, price: 120, totalPrice: 240 },
                { productName: 'Croissant', quantity: 1, price: 85, totalPrice: 85 }
            ],
            total: 325,
            saleDate: today.toISOString(),
            createdAt: today.toISOString()
        },
        {
            id: 'DEMO-SALE-2',
            orderId: 'DEMO-ORD-2',
            items: [
                { productName: 'Americano', quantity: 3, price: 80, totalPrice: 240 }
            ],
            total: 240,
            saleDate: today.toISOString(),
            createdAt: today.toISOString()
        },
        {
            id: 'DEMO-SALE-3',
            orderId: 'DEMO-ORD-3',
            items: [
                { productName: 'Spanish Latte', quantity: 1, price: 120, totalPrice: 120 },
                { productName: 'Plain Chocolate', quantity: 2, price: 145, totalPrice: 290 }
            ],
            total: 410,
            saleDate: today.toISOString(),
            createdAt: today.toISOString()
        }
    ];
    
    // Step 3: Save the demo sales
    localStorage.setItem('salesRecords', JSON.stringify(demoSales));
    console.log('2️⃣ Created demo sales data');
    
    // Step 4: Calculate expected totals
    const todayTotal = demoSales.reduce((sum, sale) => sum + sale.total, 0);
    console.log('3️⃣ Expected today\'s total:', todayTotal);
    
    // Step 5: Reload the dashboard
    console.log('4️⃣ Reloading dashboard...');
    loadSalesData();
    
    console.log('✅ Demo complete! Check the dashboard.');
}

// Call demoSalesFlow() in console to see working sales data

//# sourceMappingURL=admin-dashboard.js.map
// Function to convert existing completed orders to sales records
function convertCompletedOrdersToSales() {
    console.log('🔄 Converting completed orders to sales records...');
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const existingSalesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    
    console.log('📦 Found orders:', orders.length);
    console.log('📊 Existing sales records:', existingSalesRecords.length);
    
    // Find completed orders that don't have sales records
    const completedOrders = orders.filter(order => order.status === 'completed');
    console.log('✅ Completed orders found:', completedOrders.length);
    
    if (completedOrders.length === 0) {
        console.log('ℹ️ No completed orders to convert');
        return existingSalesRecords;
    }
    
    const newSalesRecords = [];
    
    completedOrders.forEach(order => {
        // Check if we already have a sales record for this order
        const existingSale = existingSalesRecords.find(sale => sale.orderId === order.id);
        
        if (!existingSale) {
            console.log('🆕 Creating sales record for order:', order.id, 'Total:', order.total);
            
            // Create sales record from completed order
            const saleRecord = {
                id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId: order.id,
                orderNumber: order.id,
                customerId: order.customerId || 'guest',
                customerInfo: order.customerInfo || { name: 'Guest Customer' },
                staffId: 'staff-001',
                staffName: 'Staff User',
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
                subtotal: order.subtotal || (order.total * 0.893),
                tax: order.tax || (order.total * 0.107),
                discount: order.discount || 0,
                tip: order.tip || 0,
                total: order.total,
                paymentMethod: order.paymentMethod || 'cash',
                orderType: order.type || order.orderType || 'pickup',
                saleDate: order.updatedAt || new Date().toISOString(),
                shift: determineShift(),
                location: 'main-store',
                createdAt: order.updatedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            newSalesRecords.push(saleRecord);
            console.log('✅ Created sales record:', saleRecord.id, 'Amount:', saleRecord.total);
        } else {
            console.log('⚠️ Sales record already exists for order:', order.id);
        }
    });
    
    // Combine all sales records
    const allSalesRecords = [...existingSalesRecords, ...newSalesRecords];
    
    if (newSalesRecords.length > 0) {
        // Save updated sales records
        localStorage.setItem('salesRecords', JSON.stringify(allSalesRecords));
        console.log('✅ Created', newSalesRecords.length, 'new sales records');
        console.log('📊 Total sales records now:', allSalesRecords.length);
    } else {
        console.log('ℹ️ No new sales records to create');
    }
    
    return allSalesRecords;
}

function determineShift() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

// Debug function to check current data state
function debugSalesData() {
    console.log('🔍 === DEBUGGING SALES DATA ===');
    
    // Check orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    console.log('📦 Total orders:', orders.length);
    
    const completedOrders = orders.filter(order => order.status === 'completed');
    console.log('✅ Completed orders:', completedOrders.length);
    
    completedOrders.forEach(order => {
        console.log(`   Order ${order.id}: ₱${order.total} (${order.items.length} items)`);
    });
    
    // Check sales records
    const salesRecords = JSON.parse(localStorage.getItem('salesRecords')) || [];
    console.log('📊 Sales records:', salesRecords.length);
    
    salesRecords.forEach(record => {
        console.log(`   Sale ${record.id}: ₱${record.total} on ${new Date(record.saleDate).toLocaleDateString()}`);
    });
    
    // Calculate totals
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayTotal = salesRecords.filter(record => {
        const saleDate = new Date(record.saleDate);
        return saleDate >= todayStart;
    }).reduce((sum, record) => sum + record.total, 0);
    
    console.log('💰 Today\'s calculated total:', todayTotal);
    
    console.log('🔍 === END DEBUG ===');
}

// Call debugSalesData() in console to check data state
// Force sales data creation from completed orders
function forceSalesDataCreation() {
    console.log('🔧 Force creating sales data from completed orders...');
    
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    console.log('📦 Found orders:', orders.length);
    
    // Find completed orders
    const completedOrders = orders.filter(order => order.status === 'completed');
    console.log('✅ Completed orders:', completedOrders.length);
    
    // Clear existing sales records
    localStorage.removeItem('salesRecords');
    
    // Create sales records from completed orders
    const salesRecords = completedOrders.map(order => {
        const salesRecord = {
            id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            orderId: order.id,
            items: order.items.map(item => ({
                productName: item.name,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.price * item.quantity
            })),
            total: order.total,
            saleDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        console.log('💰 Created sales record:', salesRecord.id, 'Amount:', salesRecord.total);
        return salesRecord;
    });
    
    // Save sales records
    localStorage.setItem('salesRecords', JSON.stringify(salesRecords));
    
    console.log('✅ Created', salesRecords.length, 'sales records');
    console.log('📊 Total sales amount:', salesRecords.reduce((sum, record) => sum + record.total, 0));
    
    // Reload sales data
    loadSalesDataFromLocalStorage();
    
    return salesRecords;
}

// Call forceSalesDataCreation() to create sales data from completed orders

// Test function to create completed orders and sales data
function createCompletedOrdersAndSales() {
    console.log('🧪 Creating completed orders and sales data...');
    
    // Create some completed orders
    const completedOrders = [
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
                    totalPrice: 240
                },
                {
                    name: 'Croissant',
                    price: 85,
                    quantity: 1,
                    totalPrice: 85
                }
            ],
            total: 325,
            status: 'completed',
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
                    quantity: 3,
                    totalPrice: 240
                }
            ],
            total: 240,
            status: 'completed',
            timestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    // Save orders
    localStorage.setItem('orders', JSON.stringify(completedOrders));
    
    // Force create sales data
    forceSalesDataCreation();
    
    console.log('✅ Created completed orders and sales data');
    
    return completedOrders;
}

// Call createCompletedOrdersAndSales() to create test data

// Test logout function
function testLogout() {
    console.log('🧪 Testing logout functionality...');
    
    // Check if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    console.log('🔘 Logout button found:', !!logoutBtn);
    
    if (logoutBtn) {
        console.log('🖱️ Clicking logout button...');
        logoutBtn.click();
    } else {
        console.log('❌ Logout button not found');
    }
}

// Call testLogout() to test logout functionality
