document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const profileIcon = document.getElementById('profileIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signBtn = document.getElementById('signBtn');
    const browseBtn = document.getElementById('browseBtn');
    const cartIcon = document.querySelector('.cart-icon');
    const cartCount = document.getElementById('cartCount');
    
    // Profile dropdown elements
    const myProfileBtn = document.getElementById('myProfile');
    const myOrdersBtn = document.getElementById('myOrders');
    const logoutBtn = document.getElementById('logout');
    
    // Check authentication status
    let isAuthenticated = checkAuthStatus();
    
    // Initialize UI based on authentication
    updateUI();
    
    // Update cart count
    updateCartCount();
    
    // Event Listeners
    profileIcon.addEventListener('click', toggleDropdown);
    signBtn.addEventListener('click', handleSignIn);
    browseBtn.addEventListener('click', handleBrowse);
    cartIcon.addEventListener('click', handleCartClick);
    
    // Profile dropdown actions
    myProfileBtn.addEventListener('click', handleMyProfile);
    myOrdersBtn.addEventListener('click', handleMyOrders);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!profileIcon.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Functions
    function checkAuthStatus() {
        // Check if user is authenticated (you can modify this based on your auth system)
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        return token && userData;
    }
    
    function updateUI() {
        if (isAuthenticated) {
            // Show profile dropdown, hide sign in button
            profileIcon.style.display = 'block';
            signBtn.classList.remove('show');
        } else {
            // Show sign in button, hide profile dropdown
            profileIcon.style.display = 'none';
            signBtn.classList.add('show');
        }
    }
    
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Show/hide cart count badge
        if (totalItems > 0) {
            cartCount.style.display = 'flex';
        } else {
            cartCount.style.display = 'none';
        }
    }
    
    function toggleDropdown(event) {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    }
    
    function handleSignIn() {
        // Redirect to authentication page
        window.location.href = 'auth.html';
    }
    
    function handleBrowse() {
        // Redirect to menu page
        window.location.href = 'menu.html';
    }
    
    function handleCartClick() {
        if (isAuthenticated) {
            // Redirect to cart page
            window.location.href = 'cart.html';
        } else {
            // Show message or redirect to auth
            if (confirm('Please sign in to view your cart. Would you like to sign in now?')) {
                window.location.href = 'auth.html';
            }
        }
    }
    
    function handleMyProfile() {
        if (isAuthenticated) {
            // Redirect to profile page (to be implemented)
            alert('Profile page coming soon!');
        } else {
            handleSignIn();
        }
        dropdownMenu.classList.remove('show');
    }
    
    function handleMyOrders() {
        if (isAuthenticated) {
            // Redirect to orders page (to be implemented)
            alert('Orders page coming soon!');
        } else {
            handleSignIn();
        }
        dropdownMenu.classList.remove('show');
    }
    
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear authentication data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            
            // Update authentication status
            isAuthenticated = false;
            updateUI();
            updateCartCount();
            
            // Optional: Clear cart for security
            // localStorage.removeItem('cart');
            
            alert('You have been logged out successfully.');
        }
        dropdownMenu.classList.remove('show');
    }
    
    // Social media links functionality
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const platform = this.textContent.toLowerCase();
            
            // You can replace these with actual social media URLs
            const socialUrls = {
                facebook: 'https://facebook.com/mcphcoffee',
                instagram: 'https://instagram.com/mcphcoffee',
                threads: 'https://threads.net/mcphcoffee'
            };
            
            if (socialUrls[platform]) {
                window.open(socialUrls[platform], '_blank');
            }
        });
    });
    
    // Listen for cart updates (from other pages)
    window.addEventListener('storage', function(event) {
        if (event.key === 'cart') {
            updateCartCount();
        }
    });
    
    // Listen for authentication changes
    window.addEventListener('storage', function(event) {
        if (event.key === 'authToken' || event.key === 'userData') {
            isAuthenticated = checkAuthStatus();
            updateUI();
        }
    });
    
    // Smooth scrolling for any anchor links (if added later)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add loading state to buttons
    function addLoadingState(button, originalText) {
        button.disabled = true;
        button.textContent = 'Loading...';
        
        // Remove loading state after 2 seconds (or when navigation completes)
        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
        }, 2000);
    }
    
    // Enhanced click handlers with loading states
    browseBtn.addEventListener('click', function() {
        addLoadingState(this, 'Browse');
    });
    
    signBtn.addEventListener('click', function() {
        addLoadingState(this, 'Sign In / Sign Up');
    });
});