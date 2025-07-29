// Global variables
let allProducts = [];
let filteredProducts = [];
let selectedProduct = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let availableAddons = [];
let isAuthenticated = false;
let currentUser = null;

console.log('🚀 Menu.js initializing...');

// DOM elements
let searchInput, searchBtn, productsGrid, resultsCount;

// Initialize DOM elements
function initializeDOM() {
    console.log('🎯 Initializing DOM elements...');
    
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    productsGrid = document.getElementById('productsGrid');
    resultsCount = document.getElementById('resultsCount');
    
    // Check if critical elements exist
    if (!productsGrid) {
        console.error('❌ Critical element missing: productsGrid');
        return false;
    }
    
    console.log('✅ DOM elements initialized successfully');
    return true;
}

// Modal elements
const drinkModal = document.getElementById('drinkModal');
const foodModal = document.getElementById('foodModal');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing menu...');
    
    // Initialize DOM elements first
    if (!initializeDOM()) {
        console.error('❌ Failed to initialize DOM elements');
        return;
    }
    
    checkAuthStatus();
    updateHeaderUI();
    initializeMenu();
    setupEventListeners();
    updateCartCount();
    console.log('✅ Menu initialization complete');
});

// Initialize menu functionality
function initializeMenu() {
    loadProducts();
    loadAddons();
}

// Setup event listeners
function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Sign in button
    const signBtn = document.getElementById('signBtn');
    if (signBtn) {
        signBtn.addEventListener('click', function() {
            window.location.href = 'auth.html';
        });
    }
    
    // Cart icon
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            if (isAuthenticated) {
                window.location.href = 'cart.html';
            } else {
                if (confirm('Please sign in to view your cart. Would you like to sign in now?')) {
                    window.location.href = 'auth.html';
                }
            }
        });
    }
    
    // Profile dropdown
    const profileIcon = document.getElementById('profileIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (profileIcon) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('show');
            }
        });
    }
    
    // Profile dropdown actions
    const myProfile = document.getElementById('myProfile');
    const myOrders = document.getElementById('myOrders');
    const logout = document.getElementById('logout');
    
    if (myProfile) {
        myProfile.addEventListener('click', function() {
            alert('Profile page coming soon!');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        });
    }
    
    if (myOrders) {
        myOrders.addEventListener('click', function() {
            alert('Orders page coming soon!');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        });
    }
    
    if (logout) {
        logout.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Orders link functionality
    const myOrdersLink = document.getElementById('myOrders');
    if (myOrdersLink) {
        myOrdersLink.addEventListener('click', function(e) {
            e.preventDefault();
            showOrderHistory();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        if (dropdownMenu) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Modal event listeners
    setupModalEventListeners();
    
    // Logo click handler
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        logo.style.cursor = 'pointer';
    }
    
    console.log('✅ Event listeners set up successfully');
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Drink modal
    const closeDrinkModal = document.getElementById('closeDrinkModal');
    const addDrinkToCart = document.getElementById('addDrinkToCart');
    const decreaseDrinkQty = document.getElementById('decreaseDrinkQty');
    const increaseDrinkQty = document.getElementById('increaseDrinkQty');
    
    if (closeDrinkModal) {
        closeDrinkModal.addEventListener('click', () => closeDrinkCustomization());
    }
    
    if (addDrinkToCart) {
        addDrinkToCart.addEventListener('click', addDrinkToCartHandler);
    }
    
    if (decreaseDrinkQty) {
        decreaseDrinkQty.addEventListener('click', () => updateQuantity('drink', -1));
    }
    
    if (increaseDrinkQty) {
        increaseDrinkQty.addEventListener('click', () => updateQuantity('drink', 1));
    }
    
    // Food modal
    const closeFoodModal = document.getElementById('closeFoodModal');
    const addFoodToCart = document.getElementById('addFoodToCart');
    const decreaseFoodQty = document.getElementById('decreaseFoodQty');
    const increaseFoodQty = document.getElementById('increaseFoodQty');
    
    if (closeFoodModal) {
        closeFoodModal.addEventListener('click', () => closeFoodCustomization());
    }
    
    if (addFoodToCart) {
        addFoodToCart.addEventListener('click', addFoodToCartHandler);
    }
    
    if (decreaseFoodQty) {
        decreaseFoodQty.addEventListener('click', () => updateQuantity('food', -1));
    }
    
    if (increaseFoodQty) {
        increaseFoodQty.addEventListener('click', () => updateQuantity('food', 1));
    }
    
    // Close modal when clicking outside
    drinkModal.addEventListener('click', function(e) {
        if (e.target === drinkModal) {
            closeDrinkCustomization();
        }
    });
    
    foodModal.addEventListener('click', function(e) {
        if (e.target === foodModal) {
            closeFoodCustomization();
        }
    });
}

// Load products from API
async function loadProducts() {
    try {
        console.log('🔄 Loading products from API...');
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('✅ Products loaded:', products);
        
        // Ensure we have an array
        if (!Array.isArray(products)) {
            throw new Error('Products response is not an array');
        }
        
        // Filter out add-ons from main product display
        allProducts = products.filter(product => product.category !== 'add-ons');
        filteredProducts = [...allProducts];
        console.log('📊 Products arrays initialized:', {
            allProducts: allProducts.length,
            filteredProducts: filteredProducts.length,
            addonsFiltered: products.length - allProducts.length
        });
        
        renderProducts();
        updateResultsCount();
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Initialize empty arrays on error
        allProducts = [];
        filteredProducts = [];
        showError('Failed to load products. Please try again later.');
    }
}

// Load add-ons from API
async function loadAddons() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch add-ons');
        }
        
        const products = await response.json();
        // Filter products that are add-ons
        availableAddons = products.filter(product => 
            product.category === 'add-ons' && product.inStock
        );
        
        console.log('Available add-ons:', availableAddons);
    } catch (error) {
        console.error('Error loading add-ons:', error);
        availableAddons = [];
    }
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    console.log('🔍 Searching for:', searchTerm);
    
    if (searchTerm === '') {
        // If search is empty, show all products
        filteredProducts = [...allProducts];
    } else {
        // Filter products based on search term
        filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts();
    updateResultsCount();
    
    // Reset navigation to show we're in search mode
    if (searchTerm !== '') {
        const navButtons = [allItemsBtn, drinksBtn, foodBtn];
        navButtons.forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
    }
}

// Render products in the grid
function renderProducts() {
    console.log('🎨 Rendering products...', filteredProducts);
    
    // Check if productsGrid element exists
    if (!productsGrid) {
        console.error('❌ Products grid element not found!');
        return;
    }
    
    // Ensure filteredProducts is an array
    if (!Array.isArray(filteredProducts)) {
        console.error('❌ filteredProducts is not an array:', filteredProducts);
        filteredProducts = [];
    }
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    try {
        productsGrid.innerHTML = filteredProducts.map(product => {
            // Ensure product has required properties
            if (!product) {
                console.warn('⚠️ Null product found, skipping...');
                return '';
            }
            
            // Calculate display price
            let displayPrice = product.price || 0;
            
            // For drinks with sizes, show the smallest size price
            if (product.category === 'drinks' && product.sizes && product.sizes.length > 0) {
                displayPrice = Math.min(...product.sizes.map(size => size.price));
            }
            
            return `
                <div class="product-card">
                    <div class="product-info">
                        <div class="product-category">${product.category || 'Unknown'}</div>
                        <h3 class="product-name">${product.name || 'Unnamed Product'}</h3>
                        <p class="product-description">${product.description || 'No description available'}</p>
                        <div class="product-price">₱${displayPrice.toFixed(2)}</div>
                        <button class="add-to-cart-btn" onclick="openCustomization('${product._id || ''}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Products rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering products:', error);
        showError('Failed to display products. Please refresh the page.');
    }
}

// Update results count
function updateResultsCount() {
    const count = filteredProducts.length;
    resultsCount.textContent = `${count} ${count === 1 ? 'product' : 'products'} found`;
}

// Open customization modal
function openCustomization(productId) {
    console.log('🛒 Opening customization for product:', productId);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
        alert('Please sign in to add items to your cart');
        window.location.href = 'auth.html';
        return;
    }
    
    selectedProduct = allProducts.find(p => p._id === productId);
    
    if (!selectedProduct) {
        console.error('❌ Product not found:', productId);
        alert('Product not found. Please try again.');
        return;
    }
    
    console.log('✅ Selected product:', selectedProduct);
    
    if (selectedProduct.category === 'drinks') {
        openDrinkCustomization();
    } else {
        openFoodCustomization();
    }
}

// Open drink customization modal
function openDrinkCustomization() {
    console.log('🥤 Opening drink customization modal');
    
    const modal = document.getElementById('drinkModal');
    if (!modal) {
        console.error('❌ Drink modal not found');
        return;
    }
    
    // Populate modal with product info
    const nameEl = document.getElementById('drinkModalName');
    if (nameEl) nameEl.textContent = selectedProduct.name;
    
    // Reset quantity
    const quantityEl = document.getElementById('drinkQuantity');
    if (quantityEl) quantityEl.textContent = '1';
    
    // Reset size selection
    const sizeSelect = document.getElementById('sizeSelect');
    if (sizeSelect) {
        // Use real sizes data from the product
        if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
            sizeSelect.innerHTML = selectedProduct.sizes.map((size, index) => 
                `<option value="${size.name.toLowerCase()}" data-price="${size.price}" ${index === 0 ? 'selected' : ''}>
                    ${size.name} ₱${size.price}
                </option>`
            ).join('');
        } else {
            // Fallback for products without sizes
            const basePrice = selectedProduct.price || 0;
            sizeSelect.innerHTML = `
                <option value="regular" data-price="${basePrice}">Regular ₱${basePrice}</option>
            `;
        }
    }
    
    // Populate add-ons dynamically
    const addonsContainer = document.getElementById('addonsOptions');
    if (addonsContainer && availableAddons.length > 0) {
        addonsContainer.innerHTML = availableAddons.map(addon => `
            <div class="addon-item">
                <label>
                    <input type="checkbox" name="addon" value="${addon.name}" data-price="${addon.price}">
                    <span>${addon.name} ₱${addon.price}</span>
                </label>
            </div>
        `).join('');
    }
    
    // Add event listeners for price updates
    if (sizeSelect) {
        sizeSelect.addEventListener('change', updateDrinkPrice);
    }
    
    modal.querySelectorAll('#addonsOptions input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateDrinkPrice);
    });
    
    // Quantity controls
    document.getElementById('decreaseDrinkQty').addEventListener('click', function() {
        const qty = parseInt(document.getElementById('drinkQuantity').textContent);
        if (qty > 1) {
            document.getElementById('drinkQuantity').textContent = qty - 1;
            updateDrinkPrice();
        }
    });
    
    document.getElementById('increaseDrinkQty').addEventListener('click', function() {
        const qty = parseInt(document.getElementById('drinkQuantity').textContent);
        document.getElementById('drinkQuantity').textContent = qty + 1;
        updateDrinkPrice();
    });
    
    // Calculate initial price
    updateDrinkPrice();
    
    // Show modal
    modal.style.display = 'block';
    console.log('✅ Drink modal opened');
}

// Open food customization modal
function openFoodCustomization() {
    console.log('🍔 Opening food customization modal');
    
    const modal = document.getElementById('foodModal');
    if (!modal) {
        console.error('❌ Food modal not found');
        return;
    }
    
    // Populate modal with product info
    const nameEl = document.getElementById('foodModalName');
    const priceEl = document.getElementById('foodModalPrice');
    
    if (nameEl) nameEl.textContent = selectedProduct.name;
    if (priceEl) priceEl.textContent = selectedProduct.price;
    
    // Reset quantity
    const quantityEl = document.getElementById('foodQuantity');
    if (quantityEl) quantityEl.textContent = '1';
    
    // Quantity controls
    document.getElementById('decreaseFoodQty').addEventListener('click', function() {
        const qty = parseInt(document.getElementById('foodQuantity').textContent);
        if (qty > 1) {
            document.getElementById('foodQuantity').textContent = qty - 1;
            updateFoodPrice();
        }
    });
    
    document.getElementById('increaseFoodQty').addEventListener('click', function() {
        const qty = parseInt(document.getElementById('foodQuantity').textContent);
        document.getElementById('foodQuantity').textContent = qty + 1;
        updateFoodPrice();
    });
    
    // Calculate initial price
    updateFoodPrice();
    
    // Show modal
    modal.style.display = 'block';
    console.log('✅ Food modal opened');
}

// Update drink price
function updateDrinkPrice() {
    let totalPrice = 0;
    
    // Get size price (this is now the actual price, not an upcharge)
    const sizeSelect = document.getElementById('sizeSelect');
    if (sizeSelect) {
        const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
        totalPrice = parseFloat(selectedOption.dataset.price || 0);
    }
    
    // Add add-on prices
    const selectedAddons = document.querySelectorAll('#addonsOptions input[type="checkbox"]:checked');
    selectedAddons.forEach(addon => {
        totalPrice += parseFloat(addon.dataset.price || 0);
    });
    
    // Multiply by quantity
    const quantity = parseInt(document.getElementById('drinkQuantity').textContent) || 1;
    totalPrice *= quantity;
    
    document.getElementById('drinkTotalPrice').textContent = `₱${totalPrice}`;
}

// Update food price
function updateFoodPrice() {
    const quantity = parseInt(document.getElementById('foodQuantity').textContent) || 1;
    const totalPrice = (selectedProduct.price || 0) * quantity;
    
    document.getElementById('foodTotalPrice').textContent = `₱${totalPrice}`;
}

// Update quantity
function updateQuantity(type, change) {
    const quantityElement = document.getElementById(type + 'Quantity');
    let quantity = parseInt(quantityElement.textContent);
    
    quantity += change;
    
    if (quantity < 1) quantity = 1;
    if (quantity > 99) quantity = 99;
    
    quantityElement.textContent = quantity;
    
    // Update price
    if (type === 'drink') {
        updateDrinkPrice();
    } else {
        updateFoodPrice();
    }
}

// Add drink to cart
function addDrinkToCartHandler() {
    const quantity = parseInt(document.getElementById('drinkQuantity').textContent);
    
    // Get selected size
    const sizeSelect = document.getElementById('sizeSelect');
    const selectedSizeOption = sizeSelect.options[sizeSelect.selectedIndex];
    const selectedSize = {
        name: selectedSizeOption.value,
        price: parseFloat(selectedSizeOption.dataset.price)
    };
    
    // Get selected add-ons
    const selectedAddons = Array.from(document.querySelectorAll('#addonsOptions input[type="checkbox"]:checked'))
        .map(addon => ({
            name: addon.value,
            price: parseFloat(addon.dataset.price)
        }));
    
    const cartItem = {
        id: selectedProduct._id,
        name: selectedProduct.name,
        category: selectedProduct.category,
        basePrice: selectedSize.price, // Use the actual size price as base
        quantity: quantity,
        size: selectedSize.name,
        sizePrice: selectedSize.price,
        addons: selectedAddons.map(addon => addon.name),
        addonsPrice: selectedAddons.reduce((total, addon) => total + addon.price, 0),
        totalPrice: parseFloat(document.getElementById('drinkTotalPrice').textContent.replace('₱', ''))
    };
    
    addToCart(cartItem);
    closeDrinkCustomization();
}

// Add food to cart
function addFoodToCartHandler() {
    const quantity = parseInt(document.getElementById('foodQuantity').textContent);
    
    const cartItem = {
        id: selectedProduct._id,
        name: selectedProduct.name,
        category: selectedProduct.category,
        basePrice: selectedProduct.price,
        quantity: quantity,
        totalPrice: parseFloat(document.getElementById('foodTotalPrice').textContent.replace('₱', ''))
    };
    
    addToCart(cartItem);
    closeFoodCustomization();
}

// Add item to cart
function addToCart(item) {
    // Check if item with same customizations already exists
    const existingItemIndex = cart.findIndex(cartItem => 
        cartItem.id === item.id && 
        JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
    );
    
    if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += item.quantity;
        cart[existingItemIndex].totalPrice += item.totalPrice;
    } else {
        cart.push(item);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show success message
    showNotification(`${item.name} added to cart!`, 'success');
}

// Update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Close drink customization modal
function closeDrinkCustomization() {
    const modal = document.getElementById('drinkModal');
    modal.style.display = 'none';
}

// Close food customization modal
function closeFoodCustomization() {
    const modal = document.getElementById('foodModal');
    modal.style.display = 'none';
}

// Show error message
function showError(message) {
    productsGrid.innerHTML = `
        <div class="no-products">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
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

// Check authentication status
function checkAuthStatus() {
    console.log('🔍 Checking authentication status...');
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        isAuthenticated = true;
        currentUser = JSON.parse(userData);
        console.log('✅ User authenticated:', currentUser);
    } else {
        isAuthenticated = false;
        currentUser = null;
        console.log('❌ User not authenticated (guest mode)');
    }
}

// Update header UI based on authentication
function updateHeaderUI() {
    console.log('🎨 Updating header UI...');
    const profileIcon = document.getElementById('profileIcon');
    const signBtn = document.getElementById('signBtn');
    const cartIcon = document.querySelector('.cart-icon');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (isAuthenticated && currentUser && currentUser.role === 'customer') {
        // Show cart and profile for authenticated customers
        if (cartIcon) cartIcon.style.display = 'block';
        if (profileDropdown) profileDropdown.style.display = 'block';
        if (signBtn) signBtn.style.display = 'none';
        console.log('✅ Displaying customer UI (cart + profile)');
    } else {
        // Show sign in button for guests
        if (cartIcon) cartIcon.style.display = 'none';
        if (profileDropdown) profileDropdown.style.display = 'none';
        if (signBtn) signBtn.style.display = 'block';
        console.log('✅ Displaying guest UI (sign in button)');
    }
}

// Filter products by category
function filterByCategory(category) {
    console.log('🔍 Filtering by category:', category);
    
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => product.category === category);
    }
    
    renderProducts();
    updateResultsCount();
}

// Show order history
function showOrderHistory() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('orderHistoryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderHistoryModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order History</h3>
                    <button class="modal-close" id="closeOrderHistoryModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="order-history-list" id="orderHistoryList">
                        <!-- Order history will be populated here -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add close event listener
        document.getElementById('closeOrderHistoryModal').addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
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
                    <div class="order-id-section">
                        <div class="order-id">${order.id}</div>
                        <div class="order-date">${new Date(order.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div class="order-status ${order.status}">${order.status}</div>
                </div>
                <div class="order-details">
                    <div class="order-items">
                        <h4>Items:</h4>
                        <ul class="items-list">
                            ${order.items.map(item => `
                                <li class="item-detail">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-quantity">×${item.quantity}</span>
                                    <span class="item-price">₱${(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="order-summary">
                        <div class="order-type">
                            <i class="fas fa-${order.type === 'pickup' ? 'shopping-bag' : 'truck'}"></i>
                            ${order.type === 'pickup' ? 'Pickup' : 'Delivery'}
                        </div>
                        <div class="order-total">
                            <span>Total: </span>
                            <span class="total-amount">₱${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

// Test JavaScript loading
console.log('🚀 Menu.js loaded successfully');
