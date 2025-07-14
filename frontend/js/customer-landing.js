// Customer landing page specific functionality

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'customer') {
        // Redirect to public landing page if not authenticated as customer
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Initialize customer dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }
    
    // Get user info from localStorage
    const userName = localStorage.getItem('userName');
    
    // Update UI with user info if available
    if (userName) {
        updateUserInterface(userName);
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Cart button event listener
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.addEventListener('click', function() {
            openCart();
        });
    }
    
    // Profile dropdown toggle
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            profileDropdown.classList.remove('show');
        });
    }
    
    // My Profile link
    const myProfileLink = document.getElementById('myProfileLink');
    if (myProfileLink) {
        myProfileLink.addEventListener('click', function(e) {
            e.preventDefault();
            openProfile();
        });
    }
    
    // Logout functionality
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Browse Menu button
    const browseMenuButton = document.getElementById('browseMenuButton');
    if (browseMenuButton) {
        browseMenuButton.addEventListener('click', function() {
            browseMenu();
        });
    }
}

// Update UI with user information
function updateUserInterface(userName) {
    // You can add welcome message or user-specific content here
    console.log(`Welcome, ${userName}!`);
    
    // Could update header with user name, customize content, etc.
    // For now, just log the user info
}

// Cart functionality
function openCart() {
    // TODO: Implement cart functionality
    console.log('Opening cart...');
    // This would redirect to cart.html or open a cart modal
}

// Profile functionality
function openProfile() {
    // TODO: Implement profile functionality
    console.log('Opening profile...');
    // This would redirect to profile.html
}

// Menu browsing
function browseMenu() {
    // TODO: Implement menu browsing - redirect to menu.html
    console.log('Browsing menu...');
    
    // Show notification for now
    if (window.landingPage && window.landingPage.showNotification) {
        window.landingPage.showNotification('Redirecting to menu page...', 'info');
    }
    
    // Future: Redirect to menu page
    // window.location.href = 'menu.html';
}

// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('rememberMe');
        
        // Clear any other user-specific data
        localStorage.removeItem('cartItems');
        localStorage.removeItem('favorites');
        
        // Redirect to public landing page
        window.location.href = 'index.html';
    }
}

// Session management
function refreshSession() {
    // TODO: Implement session refresh if needed
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token is still valid
        // This would typically involve an API call to the server
        console.log('Session still valid');
    }
}

// Auto-refresh session every 30 minutes
setInterval(refreshSession, 30 * 60 * 1000);

// Export functions for use in other scripts
window.customerLanding = {
    checkAuthentication,
    updateUserInterface,
    openCart,
    openProfile,
    browseMenu,
    logout
};
