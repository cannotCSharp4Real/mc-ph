class CartPage {
    constructor() {
        this.cart = this.loadCart();
        this.currentUser = this.loadCurrentUser();
        this.taxRate = 0.0825; // 8.25% tax rate
        this.deliveryFee = 3.99;
        this.promoCode = null;
        this.discountAmount = 0;
        this.orderType = 'pickup';
        this.paymentMethod = 'cash';
        this.isProcessing = false;
        
        // Available promo codes
        this.promoCodes = {
            'WELCOME10': { discount: 0.10, type: 'percentage', description: '10% off your order' },
            'SAVE5': { discount: 5.00, type: 'fixed', description: '$5 off your order' },
            'FREESHIP': { discount: 'delivery', type: 'special', description: 'Free delivery' },
            'STUDENT': { discount: 0.15, type: 'percentage', description: '15% student discount' }
        };
        
        this.init();
    }

    init() {
        // Add sample data if cart is empty (for testing)
        if (this.cart.length === 0) {
            this.cart = [
                {
                    name: 'Spanish Latte',
                    size: 'Large',
                    price: 95,
                    basePrice: 95,
                    quantity: 1,
                    addons: [
                        { name: 'Espresso Shot', price: 30 },
                        { name: 'Ice Cream', price: 40 }
                    ],
                    totalPrice: 165
                },
                {
                    name: 'Grilled Cheese',
                    price: 150,
                    basePrice: 150,
                    quantity: 1,
                    addons: [],
                    totalPrice: 150
                }
            ];
        }
        
        this.setupEventListeners();
        this.renderCart();
        this.updateTotals();
        this.setupFormValidation();
        this.loadUserData();
    }

    setupEventListeners() {
        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
        
        // Promo code application
        const applyPromoBtn = document.getElementById('applyPromoBtn');
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', () => this.applyPromoCode());
        }
        
        const promoCodeInput = document.getElementById('promoCode');
        if (promoCodeInput) {
            promoCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyPromoCode();
                }
            });
        }
        
        // Order type selection - Updated for new toggle design
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const orderType = btn.dataset.type;
                this.setOrderType(orderType);
            });
        });
        
        // Payment method selection
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', () => this.handlePaymentMethodChange());
        });
        
        // Form submission
        document.getElementById('checkoutForm').addEventListener('submit', (e) => this.handleCheckout(e));
        
        // Card number formatting
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => this.formatCardNumber(e));
        }
        
        const cardExpiry = document.getElementById('cardExpiry');
        if (cardExpiry) {
            cardExpiry.addEventListener('input', (e) => this.formatCardExpiry(e));
        }
        
        const cardCvv = document.getElementById('cardCvv');
        if (cardCvv) {
            cardCvv.addEventListener('input', (e) => this.formatCardCvv(e));
        }
        
        // Phone number formatting
        const customerPhone = document.getElementById('customerPhone');
        if (customerPhone) {
            customerPhone.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }
        
        // Real-time validation
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Profile dropdown toggle
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });
            
            document.addEventListener('click', () => {
                profileDropdown.classList.remove('show');
            });
        }
    }

    setOrderType(orderType) {
        this.orderType = orderType;
        
        // Update button states
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === orderType) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide customer info section based on order type
        const customerInfoSection = document.getElementById('customerInfoSection');
        if (customerInfoSection) {
            if (orderType === 'delivery') {
                customerInfoSection.style.display = 'block';
                // Make delivery fields required
                customerInfoSection.querySelectorAll('input').forEach(input => {
                    input.setAttribute('required', 'required');
                });
            } else {
                customerInfoSection.style.display = 'none';
                // Remove required attribute for pickup
                customerInfoSection.querySelectorAll('input').forEach(input => {
                    input.removeAttribute('required');
                });
            }
        }
        
        this.updateTotals();
    }

    loadCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    loadCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    loadUserData() {
        if (this.currentUser) {
            document.getElementById('customerName').value = this.currentUser.name || '';
            document.getElementById('customerEmail').value = this.currentUser.email || '';
            document.getElementById('customerPhone').value = this.currentUser.phone || '';
        }
    }

    renderCart() {
        const cartItemsContainer = document.getElementById('cartItemsSection');
        const emptyCartContainer = document.getElementById('emptyCart');
        const cartCount = document.getElementById('cartCount');

        // Update cart count
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }

        if (this.cart.length === 0) {
            cartItemsContainer.style.display = 'none';
            emptyCartContainer.style.display = 'block';
            return;
        }

        cartItemsContainer.style.display = 'block';
        emptyCartContainer.style.display = 'none';

        // Render cart items
        cartItemsContainer.innerHTML = this.cart.map((item, index) => {
            const addonsHtml = item.addons && item.addons.length > 0 ? 
                `<div class="cart-item-addons">
                    ${item.addons.map(addon => `
                        <div class="addon-item">
                            <span class="addon-name">${addon.name}</span>
                            <span class="addon-price">₱${addon.price}</span>
                        </div>
                    `).join('')}
                </div>` : '';

            return `
                <div class="cart-item-card" data-index="${index}">
                    <div class="cart-item-header">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-size">${item.size ? `${item.size} ` : ''}₱${item.basePrice || item.price}</div>
                        </div>
                        <div class="cart-item-price">₱${(item.totalPrice || item.price * item.quantity).toFixed(0)}</div>
                    </div>
                    ${addonsHtml}
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${index}, 1)" ${item.quantity >= 99 ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateQuantity(index, change, isAbsolute = false) {
        if (index >= 0 && index < this.cart.length) {
            if (isAbsolute) {
                const newQuantity = parseInt(change);
                if (newQuantity > 0 && newQuantity <= 99) {
                    this.cart[index].quantity = newQuantity;
                }
            } else {
                const newQuantity = this.cart[index].quantity + change;
                if (newQuantity > 0 && newQuantity <= 99) {
                    this.cart[index].quantity = newQuantity;
                }
            }
            
            this.saveCart();
            this.renderCart();
            this.updateTotals();
            this.showNotification('Cart updated successfully', 'success');
        }
    }

    removeItem(index) {
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.renderCart();
            this.updateTotals();
            this.showNotification('Item removed from cart', 'success');
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your entire cart?')) {
            this.cart = [];
            this.saveCart();
            this.renderCart();
            this.updateTotals();
            this.showNotification('Cart cleared successfully', 'success');
        }
    }

    updateTotals() {
        const subtotal = this.cart.reduce((total, item) => {
            const itemTotal = (item.totalPrice || item.price) * item.quantity;
            return total + itemTotal;
        }, 0);
        
        const tax = subtotal * this.taxRate;
        const delivery = this.orderType === 'delivery' ? this.deliveryFee : 0;
        
        let discount = 0;
        if (this.promoCode) {
            const promo = this.promoCodes[this.promoCode];
            if (promo) {
                if (promo.type === 'percentage') {
                    discount = subtotal * promo.discount;
                } else if (promo.type === 'fixed') {
                    discount = promo.discount;
                } else if (promo.type === 'special' && promo.discount === 'delivery') {
                    discount = delivery;
                }
            }
        }
        
        const total = subtotal + tax + delivery - discount;

        // Update order summary
        const orderSummary = document.querySelector('.order-summary');
        if (orderSummary) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            
            orderSummary.innerHTML = `
                <div class="summary-row">
                    <span class="summary-label">Items Total</span>
                    <span class="summary-value">₱${subtotal.toFixed(0)}</span>
                </div>
                <div class="summary-row total-row">
                    <span class="summary-label">Total</span>
                    <span class="summary-value">₱${total.toFixed(0)}</span>
                </div>
            `;
        }

        // Store totals for checkout
        this.totals = {
            subtotal,
            tax,
            delivery,
            discount,
            total
        };
    }

    applyPromoCode() {
        const promoInput = document.getElementById('promoCode');
        const promoMessage = document.getElementById('promoMessage');
        const code = promoInput.value.trim().toUpperCase();
        
        if (!code) {
            this.showPromoMessage('Please enter a promo code', 'error');
            return;
        }
        
        if (this.promoCodes[code]) {
            this.promoCode = code;
            this.updateTotals();
            this.showPromoMessage(`Promo code applied: ${this.promoCodes[code].description}`, 'success');
            promoInput.value = '';
        } else {
            this.showPromoMessage('Invalid promo code', 'error');
        }
    }

    showPromoMessage(message, type) {
        const promoMessage = document.getElementById('promoMessage');
        promoMessage.textContent = message;
        promoMessage.className = `promo-message ${type}`;
        promoMessage.style.display = 'block';
        
        setTimeout(() => {
            promoMessage.style.display = 'none';
        }, 5000);
    }

    handleOrderTypeChange() {
        const selectedOrderType = document.querySelector('input[name="orderType"]:checked');
        if (selectedOrderType) {
            this.setOrderType(selectedOrderType.value);
        }
    }

    handlePaymentMethodChange() {
        this.paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const cardSection = document.getElementById('cardSection');
        
        if (this.paymentMethod === 'card') {
            cardSection.style.display = 'block';
        } else {
            cardSection.style.display = 'none';
        }
    }

    formatCardNumber(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = value.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        
        if (parts.length) {
            e.target.value = parts.join(' ');
        } else {
            e.target.value = value;
        }
    }

    formatCardExpiry(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    formatCardCvv(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 6) {
            value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 10)}`;
        } else if (value.length >= 3) {
            value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
        }
        e.target.value = value;
    }

    setupFormValidation() {
        const form = document.getElementById('checkoutForm');
        
        // Add custom validation patterns
        document.getElementById('customerEmail').pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
        document.getElementById('customerPhone').pattern = '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';
        document.getElementById('cardNumber').pattern = '^[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}$';
        document.getElementById('cardExpiry').pattern = '^(0[1-9]|1[0-2])\\/([0-9]{2})$';
        document.getElementById('cardCvv').pattern = '^[0-9]{3,4}$';
        document.getElementById('deliveryZip').pattern = '^[0-9]{5}(-[0-9]{4})?$';
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearFieldError(field);

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        switch (fieldName) {
            case 'customerEmail':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
                
            case 'customerPhone':
                if (value && !this.isValidPhone(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
                break;
                
            case 'cardNumber':
                if (this.paymentMethod === 'card' && value && !this.isValidCardNumber(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid card number';
                }
                break;
                
            case 'cardExpiry':
                if (this.paymentMethod === 'card' && value && !this.isValidCardExpiry(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid expiry date';
                }
                break;
                
            case 'cardCvv':
                if (this.paymentMethod === 'card' && value && !this.isValidCardCvv(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid CVV';
                }
                break;
                
            case 'deliveryZip':
                if (this.orderType === 'delivery' && value && !this.isValidZip(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid ZIP code';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        formGroup.classList.remove('error');
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        formGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
        return phoneRegex.test(phone);
    }

    isValidCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');
        return cleaned.length === 16 && /^[0-9]{16}$/.test(cleaned);
    }

    isValidCardExpiry(expiry) {
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryRegex.test(expiry)) return false;
        
        const [month, year] = expiry.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const currentDate = new Date();
        currentDate.setDate(1); // Set to first day of current month
        
        return expiryDate >= currentDate;
    }

    isValidCardCvv(cvv) {
        return /^[0-9]{3,4}$/.test(cvv);
    }

    isValidZip(zip) {
        return /^[0-9]{5}(-[0-9]{4})?$/.test(zip);
    }

    async handleCheckout(e) {
        e.preventDefault();
        
        if (this.isProcessing) return;
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        
        // Validate form
        if (!this.validateForm()) return;
        
        this.isProcessing = true;
        this.showLoadingState();
        
        try {
            // Check inventory
            const inventoryCheck = await this.checkInventory();
            if (!inventoryCheck.success) {
                this.showNotification(inventoryCheck.message, 'error');
                return;
            }
            
            // Prepare order data
            const orderData = this.prepareOrderData();
            
            // Submit order
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to place order');
            }
            
            const order = await response.json();
            
            // Clear cart and show success
            this.cart = [];
            this.saveCart();
            this.showOrderSuccess(order);
            
        } catch (error) {
            console.error('Order error:', error);
            this.showOrderError(error.message);
        } finally {
            this.isProcessing = false;
            this.hideLoadingState();
        }
    }

    validateForm() {
        const form = document.getElementById('checkoutForm');
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Additional validation for required fields based on selections
        if (this.orderType === 'delivery') {
            const deliveryFields = ['deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip'];
            deliveryFields.forEach(fieldName => {
                const field = document.getElementById(fieldName);
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });
        }
        
        if (this.paymentMethod === 'card') {
            const cardFields = ['cardNumber', 'cardExpiry', 'cardCvv', 'cardName'];
            cardFields.forEach(fieldName => {
                const field = document.getElementById(fieldName);
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });
        }
        
        return isValid;
    }

    async checkInventory() {
        try {
            const response = await fetch('/api/products/check-inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: this.cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity
                    }))
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to check inventory');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Inventory check error:', error);
            return { success: false, message: 'Unable to verify inventory. Please try again.' };
        }
    }

    prepareOrderData() {
        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);
        
        return {
            customerId: this.currentUser ? this.currentUser.id : null,
            customerInfo: {
                name: this.sanitizeInput(formData.get('customerName')),
                email: this.sanitizeInput(formData.get('customerEmail')),
                phone: this.sanitizeInput(formData.get('customerPhone'))
            },
            items: this.cart.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.totalPrice,
                size: item.size || null,
                temperature: item.temperature || null,
                customizations: item.customizations || [],
                specialInstructions: item.specialInstructions || null
            })),
            orderType: this.orderType,
            deliveryInfo: this.orderType === 'delivery' ? {
                address: {
                    street: this.sanitizeInput(formData.get('deliveryAddress')),
                    city: this.sanitizeInput(formData.get('deliveryCity')),
                    state: this.sanitizeInput(formData.get('deliveryState')),
                    zipCode: this.sanitizeInput(formData.get('deliveryZip')),
                    instructions: this.sanitizeInput(formData.get('deliveryInstructions'))
                },
                deliveryFee: this.deliveryFee
            } : null,
            paymentMethod: this.paymentMethod,
            paymentInfo: this.paymentMethod === 'card' ? {
                cardNumber: this.sanitizeInput(formData.get('cardNumber')),
                cardName: this.sanitizeInput(formData.get('cardName')),
                // Note: In production, card details should be handled by a secure payment processor
            } : null,
            subtotal: this.totals.subtotal,
            tax: this.totals.tax,
            discount: this.totals.discount,
            total: this.totals.total,
            specialInstructions: this.sanitizeInput(formData.get('orderNotes')),
            promoCode: this.promoCode,
            estimatedPrepTime: this.orderType === 'delivery' ? 35 : 20
        };
    }

    sanitizeInput(input) {
        if (!input) return '';
        return input.toString().trim().replace(/[<>]/g, '');
    }

    showLoadingState() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        checkoutBtn.classList.add('loading');
        checkoutBtn.disabled = true;
        loadingOverlay.classList.add('active');
    }

    hideLoadingState() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        checkoutBtn.classList.remove('loading');
        checkoutBtn.disabled = false;
        loadingOverlay.classList.remove('active');
    }

    showOrderSuccess(order) {
        const modal = document.getElementById('successModal');
        const orderNumber = document.getElementById('orderNumber');
        const readyTime = document.getElementById('readyTime');
        const orderEmail = document.getElementById('orderEmail');
        
        orderNumber.textContent = order.orderNumber || order._id;
        
        const estimatedTime = new Date(Date.now() + (order.estimatedPrepTime || 20) * 60 * 1000);
        readyTime.textContent = estimatedTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        orderEmail.textContent = order.customerInfo.email;
        
        modal.classList.add('active');
        
        // Send confirmation email (in production)
        this.sendOrderConfirmation(order);
    }

    showOrderError(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message || 'An error occurred while processing your order. Please try again.';
        modal.classList.add('active');
    }

    async sendOrderConfirmation(order) {
        try {
            await fetch('/api/orders/send-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order._id,
                    email: order.customerInfo.email
                })
            });
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    // Utility methods for session management
    saveSession() {
        const sessionData = {
            cart: this.cart,
            promoCode: this.promoCode,
            orderType: this.orderType,
            paymentMethod: this.paymentMethod
        };
        sessionStorage.setItem('checkoutSession', JSON.stringify(sessionData));
    }

    loadSession() {
        const sessionData = sessionStorage.getItem('checkoutSession');
        if (sessionData) {
            const data = JSON.parse(sessionData);
            this.cart = data.cart || [];
            this.promoCode = data.promoCode || null;
            this.orderType = data.orderType || 'pickup';
            this.paymentMethod = data.paymentMethod || 'cash';
        }
    }
}

// Global helper functions for HTML onclick handlers
function updateQuantity(index, change) {
    if (cartPage) {
        cartPage.updateQuantity(index, change);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    window.location.href = '/auth.html';
}

// Initialize cart page
let cartPage;
document.addEventListener('DOMContentLoaded', () => {
    cartPage = new CartPage();
    
    // Set initial order type to pickup
    cartPage.setOrderType('pickup');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (cartPage) {
        cartPage.saveSession();
    }
});

// Handle payment processing (placeholder for integration with payment providers)
class PaymentProcessor {
    static async processPayment(paymentData) {
        // This would integrate with actual payment processors like Stripe, PayPal, etc.
        // For now, we'll simulate payment processing
        
        if (paymentData.method === 'cash') {
            return { success: true, transactionId: null };
        }
        
        // Simulate card payment processing
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: 'txn_' + Date.now(),
                    last4: paymentData.cardNumber.slice(-4)
                });
            }, 2000);
        });
    }
}

// Security utilities
class SecurityUtil {
    static sanitizeInput(input) {
        if (!input) return '';
        return input.toString()
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }
    
    static validateCSRFToken(token) {
        // Implement CSRF token validation
        const storedToken = sessionStorage.getItem('csrfToken');
        return token === storedToken;
    }
    
    static encryptCardData(cardData) {
        // In production, use proper encryption
        // This is just a placeholder
        return btoa(cardData);
    }
}

// Analytics tracking
class AnalyticsTracker {
    static trackEvent(eventName, data) {
        // Implement analytics tracking (Google Analytics, etc.)
        console.log('Analytics Event:', eventName, data);
    }
    
    static trackPurchase(orderData) {
        this.trackEvent('purchase', {
            value: orderData.total,
            currency: 'USD',
            items: orderData.items.map(item => ({
                item_id: item.productId,
                item_name: item.name,
                quantity: item.quantity,
                price: item.price
            }))
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartPage, PaymentProcessor, SecurityUtil, AnalyticsTracker };
}
