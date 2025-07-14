// Landing Page JavaScript
class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollEffects();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', () => {
            this.handleHeaderScroll();
        });

        // Intersection Observer for animations
        this.setupIntersectionObserver();
    }

    setupScrollEffects() {
        const header = document.querySelector('.header');
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            if (scrollY > 50) {
                header.style.background = 'rgba(248, 249, 250, 0.98)';
                header.style.boxShadow = '0 2px 20px rgba(212, 165, 116, 0.1)';
            } else {
                header.style.background = 'rgba(248, 249, 250, 0.95)';
                header.style.boxShadow = 'none';
            }
        });
    }

    handleHeaderScroll() {
        const header = document.querySelector('.header');
        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .category-card, .about-text, .about-image').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    setupAnimations() {
        // Stagger animations for feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.2}s`;
        });

        // Stagger animations for category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.3}s`;
        });
    }

    // Show loading state
    showLoading(element) {
        element.classList.add('loading');
    }

    // Hide loading state
    hideLoading(element) {
        element.classList.remove('loading');
    }

    // Show notification
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

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Global functions
function browseMenu() {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // Redirect to auth page
        window.location.href = 'auth.html';
        return;
    }

    // TODO: Redirect to menu/customer dashboard
    // For now, show notification
    landingPage.showNotification('Redirecting to menu...', 'info');
    
    // Simulate redirect delay
    setTimeout(() => {
        window.location.href = 'customer.html';
    }, 1000);
}

function redirectToAuth() {
    window.location.href = 'auth.html';
}

// Menu category click handlers
function viewCategory(category) {
    landingPage.showNotification(`Viewing ${category} category...`, 'info');
    // TODO: Implement category view
}

// Social media link handlers
function openSocialLink(platform) {
    const links = {
        facebook: 'https://facebook.com/mcph-coffee',
        instagram: 'https://instagram.com/mcph-coffee',
        threads: 'https://threads.net/mcph-coffee'
    };

    if (links[platform]) {
        window.open(links[platform], '_blank');
    }
}

// Contact form handler (if needed)
function handleContactForm(formData) {
    landingPage.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
    // TODO: Implement contact form submission
}

// Search functionality (if needed)
function searchMenu(query) {
    if (query.length < 2) {
        return;
    }
    
    landingPage.showNotification(`Searching for "${query}"...`, 'info');
    // TODO: Implement search functionality
}

// Location/directions handler
function openDirections() {
    const address = "30 JP Laurel Sr. St, San Roque, Marikina City";
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
}

// Newsletter signup (if needed)
function subscribeNewsletter(email) {
    if (!email || !email.includes('@')) {
        landingPage.showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    landingPage.showNotification('Thank you for subscribing to our newsletter!', 'success');
    // TODO: Implement newsletter subscription
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(price);
}

function formatTime(time) {
    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(new Date(time));
}

// Initialize the landing page
const landingPage = new LandingPage();

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    }

    .notification.info {
        border-left: 4px solid #3498db;
    }

    .notification.success {
        border-left: 4px solid #2ecc71;
    }

    .notification.warning {
        border-left: 4px solid #f39c12;
    }

    .notification.error {
        border-left: 4px solid #e74c3c;
    }

    .notification-content {
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #999;
        cursor: pointer;
        padding: 5px;
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

    @media (max-width: 768px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Handle page load
document.addEventListener('DOMContentLoaded', () => {
    // Add loading class to body initially
    document.body.classList.add('loading');
    
    // Remove loading class after page loads
    window.addEventListener('load', () => {
        document.body.classList.remove('loading');
    });
});

// Handle offline/online status
window.addEventListener('online', () => {
    landingPage.showNotification('Connection restored!', 'success');
});

window.addEventListener('offline', () => {
    landingPage.showNotification('Connection lost. Please check your internet.', 'warning');
});

// Export for use in other files
window.LandingPage = LandingPage;
