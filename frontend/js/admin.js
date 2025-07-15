// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuth()) {
        return; // Exit if not authenticated
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
        const cropModal = document.getElementById('cropModal');
        
        if (event.target === productModal) {
            closeProductModal();
        }
        if (event.target === cropModal) {
            closeCropModal();
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
    try {
        // Fetch sales summary
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
        console.error('Error loading sales data:', error);
        // Display fallback data
        displayFallbackData();
    }
}

// Load chart data from API
async function loadChartData(period) {
    try {
        const chartData = await apiRequest(`/sales/chart/${period}`);
        updateChartWithData(chartData, period);
    } catch (error) {
        console.error('Error loading chart data:', error);
        // Use fallback chart data
        initializeChart();
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
    
    if (todayElement) {
        animateNumber(todayElement, data.today);
    }
    if (monthElement) {
        animateNumber(monthElement, data.month);
    }
    if (totalElement) {
        animateNumber(totalElement, data.total);
    }
}

// Update products info
function updateProductsInfo(data) {
    const mostBoughtElement = document.getElementById('mostBought');
    const leastBoughtElement = document.getElementById('leastBought');
    
    if (mostBoughtElement) {
        mostBoughtElement.textContent = data.mostBought;
    }
    if (leastBoughtElement) {
        leastBoughtElement.textContent = data.leastBought;
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
        // Clear any stored authentication tokens
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
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
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        window.location.href = 'auth.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
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
let cropImageData = null;

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
    
    // Crop modal buttons
    const closeCropModalBtn = document.getElementById('closeCropModalBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');
    const applyCropBtn = document.getElementById('applyCropBtn');
    
    if (closeCropModalBtn) {
        closeCropModalBtn.addEventListener('click', closeCropModal);
    }
    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', closeCropModal);
    }
    if (applyCropBtn) {
        applyCropBtn.addEventListener('click', applyCrop);
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
    
    // Image upload handler
    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.addEventListener('change', handleImageUpload);
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
            ${product.image ? 
                `<img src="${product.image}" alt="${product.name}" class="product-image">` :
                `<div class="product-image-placeholder">
                    <i class="fas fa-image"></i>
                    <p>No image</p>
                </div>`
            }
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
            addSizePrice(size.name, size.price);
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
    
    // Add image if cropped
    if (cropImageData) {
        productData.image = cropImageData;
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
                name: sizeInput.value,
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
    cropImageData = null;
    document.getElementById('productForm').reset();
}

// Image upload handling
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        showCropModal(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Show crop modal
function showCropModal(imageSrc) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.getElementById('cropPreview');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to square
        const size = Math.min(img.width, img.height);
        canvas.width = 300;
        canvas.height = 300;
        
        // Calculate crop position to center the image
        const cropX = (img.width - size) / 2;
        const cropY = (img.height - size) / 2;
        
        // Draw cropped image
        ctx.drawImage(img, cropX, cropY, size, size, 0, 0, 300, 300);
        
        document.getElementById('cropModal').style.display = 'block';
    };
    img.src = imageSrc;
}

// Apply crop
function applyCrop() {
    const canvas = document.getElementById('cropPreview');
    cropImageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Show preview in main form
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${cropImageData}" alt="Preview" class="preview-image">`;
    
    closeCropModal();
}

// Close crop modal
function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
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
