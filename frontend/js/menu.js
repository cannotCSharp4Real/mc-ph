class MenuPage {
    constructor() {
        this.currentUser = null;
        this.cart = this.loadCart();
        this.products = [];
        this.filteredProducts = [];
        this.categories = [];
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.selectedProduct = null;
        this.selectedSize = null;
        this.selectedAddons = [];
        this.quantity = 1;
        this.totalPrice = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentUser();
        this.loadProducts();
        this.updateCartDisplay();
        this.createNotificationElement();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('#menu-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterProducts();
            });
        }

        // Close modal
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Modal overlay click
        const modalOverlay = document.querySelector('#customizationModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Quantity controls
        const quantityMinusBtn = document.querySelector('.quantity-minus');
        const quantityPlusBtn = document.querySelector('.quantity-plus');
        
        if (quantityMinusBtn) {
            quantityMinusBtn.addEventListener('click', () => this.updateQuantity(-1));
        }
        
        if (quantityPlusBtn) {
            quantityPlusBtn.addEventListener('click', () => this.updateQuantity(1));
        }

        // Add to cart button
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    loadCurrentUser() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                this.currentUser = decodedToken;
            } catch (error) {
                console.error('Error decoding token:', error);
                localStorage.removeItem('authToken');
            }
        }
        this.updateNavigationHeader();
    }

    updateNavigationHeader() {
        const navRight = document.querySelector('.nav-right');
        if (!navRight) return;

        if (this.currentUser) {
            navRight.innerHTML = `
                <div class="nav-item">
                    <a href="cart.html" class="nav-link">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count">${this.getCartItemCount()}</span>
                    </a>
                </div>
                <div class="nav-item dropdown">
                    <a href="#" class="nav-link dropdown-toggle">
                        <i class="fas fa-user"></i>
                    </a>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <a href="profile.html" class="dropdown-item">
                            <i class="fas fa-user-circle"></i>
                            Profile
                        </a>
                        <a href="orders.html" class="dropdown-item">
                            <i class="fas fa-receipt"></i>
                            Orders
                        </a>
                        <a href="#" class="dropdown-item">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </a>
                    </div>
                </div>
            `;
        } else {
            navRight.innerHTML = `
                <div class="nav-item">
                    <a href="cart.html" class="nav-link">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count">${this.getCartItemCount()}</span>
                    </a>
                </div>
                <div class="nav-item">
                    <a href="auth.html" class="nav-link">
                        <i class="fas fa-sign-in-alt"></i>
                        Sign In
                    </a>
                </div>
            `;
        }
    }

    async loadProducts() {
        try {
            this.showLoading();
            const response = await fetch('/api/products');
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            this.products = await response.json();
            this.filteredProducts = [...this.products];
            console.log('Products loaded:', this.products.length);
            
            this.loadCategories();
            this.renderProducts();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please try again.');
        }
    }

    loadCategories() {
        try {
            const uniqueCategories = [...new Set(this.products.map(product => product.category))];
            this.categories = [
                { id: 'all', name: 'All Items', icon: 'fas fa-th-large' },
                ...uniqueCategories.map(cat => ({
                    id: cat.toLowerCase().replace(/\s+/g, '-'),
                    name: cat,
                    icon: this.getCategoryIcon(cat)
                }))
            ];
            
            this.renderCategories();
            
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    getCategoryIcon(category) {
        const iconMap = {
            'Coffee': 'fas fa-coffee',
            'Pastry': 'fas fa-birthday-cake',
            'Food': 'fas fa-utensils',
            'Beverages': 'fas fa-glass-whiskey',
            'Desserts': 'fas fa-ice-cream'
        };
        return iconMap[category] || 'fas fa-utensils';
    }

    renderCategories() {
        const categoryList = document.querySelector('#category-list');
        if (!categoryList) return;

        categoryList.innerHTML = this.categories.map(category => `
            <button 
                class="category-btn ${this.selectedCategory === category.id ? 'active' : ''}" 
                data-category-id="${category.id}"
            >
                <i class="${category.icon}"></i>
                <span>${category.name}</span>
            </button>
        `).join('');

        categoryList.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.category-btn').getAttribute('data-category-id');
                this.filterByCategory(categoryId);
            });
        });
    }

    filterByCategory(categoryId) {
        this.selectedCategory = categoryId;
        this.filterProducts();
        this.renderCategories();
    }

    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const matchesCategory = this.selectedCategory === 'all' || 
                                  product.category.toLowerCase().replace(/\s+/g, '-') === this.selectedCategory;
            const matchesSearch = product.name.toLowerCase().includes(this.searchQuery) ||
                                product.description.toLowerCase().includes(this.searchQuery);
            
            return matchesCategory && matchesSearch;
        });
        
        this.renderProducts();
    }

    renderProducts() {
        const menuGrid = document.querySelector('#menu-grid');
        if (!menuGrid) return;

        if (this.filteredProducts.length === 0) {
            menuGrid.innerHTML = '<div class="no-results-state"><p>No products available.</p></div>';
            return;
        }

        menuGrid.innerHTML = this.filteredProducts.map(product => `
            <div class="menu-item">
                <div class="menu-item-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}">` : 
                        '<i class="fas fa-coffee"></i>'
                    }
                </div>
                <div class="menu-item-content">
                    <div class="menu-item-category">${product.category}</div>
                    <h3 class="menu-item-name">${product.name}</h3>
                    <p class="menu-item-description">${product.description}</p>
                    <div class="menu-item-footer">
                        <div class="menu-item-price">₱${product.price.toFixed(2)}</div>
                        <button class="add-to-cart-btn-mini" data-product-id="${product._id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        menuGrid.querySelectorAll('.add-to-cart-btn-mini').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                this.openCustomizationModal(productId);
            });
        });
    }

    showLoading() {
        const menuGrid = document.querySelector('#menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading menu items...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const menuGrid = document.querySelector('#menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    openCustomizationModal(productId) {
        this.selectedProduct = this.products.find(p => p._id === productId);
        
        if (!this.selectedProduct) {
            console.error('Product not found:', productId);
            return;
        }

        this.selectedSize = null;
        this.selectedAddons = [];
        this.quantity = 1;
        
        this.renderModal();
        this.showModal();
    }

    renderModal() {
        const modalTitle = document.querySelector('.modal-header h2');
        const productImage = document.querySelector('.product-image');
        const productDescription = document.querySelector('.product-description');
        const productPrice = document.querySelector('.product-price');
        const quantityDisplay = document.querySelector('.quantity-display');

        if (modalTitle) modalTitle.textContent = this.selectedProduct.name;
        if (productImage) {
            productImage.innerHTML = this.selectedProduct.image ?
                `<img src="${this.selectedProduct.image}" alt="${this.selectedProduct.name}">` :
                '<i class="fas fa-coffee"></i>';
        }
        if (productDescription) productDescription.textContent = this.selectedProduct.description;
        if (productPrice) productPrice.textContent = `₱${this.selectedProduct.price.toFixed(2)}`;
        if (quantityDisplay) quantityDisplay.textContent = this.quantity;

        this.updateTotalPrice();
    }

    updateQuantity(change) {
        this.quantity = Math.max(1, this.quantity + change);
        const quantityDisplay = document.querySelector('.quantity-display');
        if (quantityDisplay) {
            quantityDisplay.textContent = this.quantity;
        }
        this.updateTotalPrice();
    }

    updateTotalPrice() {
        if (!this.selectedProduct) return;
        
        let total = this.selectedProduct.price;
        
        const selectedSize = document.querySelector('input[name="size"]:checked');
        if (selectedSize) {
            total += parseFloat(selectedSize.dataset.price || 0);
        }
        
        const selectedAddons = document.querySelectorAll('input[name="addons"]:checked');
        selectedAddons.forEach(addon => {
            total += parseFloat(addon.dataset.price || 0);
        });
        
        total *= this.quantity;
        this.totalPrice = total;
        
        const totalPriceElement = document.querySelector('#totalPrice');
        if (totalPriceElement) {
            totalPriceElement.textContent = `₱${total.toFixed(2)}`;
        }
    }

    addToCart() {
        if (!this.selectedProduct) return;

        const cartItem = {
            id: this.selectedProduct._id,
            name: this.selectedProduct.name,
            price: this.selectedProduct.price,
            quantity: this.quantity,
            totalPrice: this.totalPrice
        };

        this.cart.push(cartItem);
        this.saveCart();
        this.updateCartDisplay();
        this.showCartNotification();
        this.closeModal();
    }

    showModal() {
        const modal = document.querySelector('#customizationModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.querySelector('#customizationModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    loadCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = this.getCartItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'block' : 'none';
        }
    }

    createNotificationElement() {
        if (!document.querySelector('#cartNotification')) {
            const notification = document.createElement('div');
            notification.id = 'cartNotification';
            notification.className = 'cart-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-check-circle"></i>
                    <span>Item added to cart!</span>
                </div>
            `;
            document.body.appendChild(notification);
        }
    }

    showCartNotification() {
        const notification = document.querySelector('#cartNotification');
        if (notification) {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }
}

let menuPage;
document.addEventListener('DOMContentLoaded', () => {
    menuPage = new MenuPage();
});