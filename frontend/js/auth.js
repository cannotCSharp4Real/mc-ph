// Authentication Module
class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Forgot password
        document.getElementById('forgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Real-time validation
        this.setupRealTimeValidation();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show/hide forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.add('hidden');
        });
        document.getElementById(`${tabName}-form`).classList.remove('hidden');
    }

    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    message = 'Please enter a valid email address';
                }
                break;
            case 'password':
                if (value.length < 6) {
                    isValid = false;
                    message = 'Password must be at least 6 characters long';
                }
                break;
            case 'text':
                if (field.id === 'registerName' && value.length < 2) {
                    isValid = false;
                    message = 'Name must be at least 2 characters long';
                }
                break;
        }

        this.updateFieldValidation(field, isValid, message);
        return isValid;
    }

    updateFieldValidation(field, isValid, message) {
        const existingError = field.parentNode.querySelector('.error-message');
        
        if (existingError) {
            existingError.remove();
        }

        if (!isValid) {
            field.style.borderColor = '#f56565';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = '#f56565';
            errorDiv.style.fontSize = '0.8rem';
            errorDiv.style.marginTop = '5px';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        } else {
            field.style.borderColor = '#d4a574';
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!this.validateLoginForm()) {
            return;
        }

        this.showLoading('Signing you in...');

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            this.hideLoading();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('authToken', data.token);
                
                this.showAlert('success', 'Login successful!', 'Welcome back!');
                setTimeout(() => {
                    this.redirectToUserDashboard(data.user.role);
                }, 1000);
            } else {
                this.showAlert('error', 'Login failed', data.message || 'Invalid credentials');
            }
        } catch (error) {
            this.hideLoading();
            this.showAlert('error', 'Connection error', 'Please check your internet connection');
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        if (!this.validateRegisterForm()) {
            return;
        }

        this.showLoading('Creating your account...');

        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();
            this.hideLoading();

            if (response.ok) {
                this.showAlert('success', 'Registration successful!', 'Please check your email for verification');
                setTimeout(() => {
                    this.switchTab('login');
                }, 2000);
            } else {
                this.showAlert('error', 'Registration failed', data.message || 'Please try again');
            }
        } catch (error) {
            this.hideLoading();
            this.showAlert('error', 'Connection error', 'Please check your internet connection');
        }
    }

    validateLoginForm() {
        const email = document.getElementById('loginEmail');
        const password = document.getElementById('loginPassword');
        
        let isValid = true;
        
        if (!this.validateField(email)) isValid = false;
        if (!this.validateField(password)) isValid = false;
        
        return isValid;
    }

    validateRegisterForm() {
        const name = document.getElementById('registerName');
        const email = document.getElementById('registerEmail');
        const password = document.getElementById('registerPassword');
        const agreeTerms = document.getElementById('agreeTerms');
        
        let isValid = true;
        
        if (!this.validateField(name)) isValid = false;
        if (!this.validateField(email)) isValid = false;
        if (!this.validateField(password)) isValid = false;
        
        if (!agreeTerms.checked) {
            this.showAlert('warning', 'Terms required', 'Please accept the terms and conditions');
            isValid = false;
        }
        
        return isValid;
    }

    async handleGoogleLogin() {
        this.showAlert('info', 'Google Sign-In', 'Google authentication coming soon!');
    }

    async handleForgotPassword() {
        const email = prompt('Please enter your email address:');
        if (!email) return;

        this.showLoading('Sending reset link...');

        try {
            const response = await fetch(`${this.apiUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            this.hideLoading();

            if (response.ok) {
                this.showAlert('success', 'Reset link sent', 'Please check your email for password reset instructions');
            } else {
                this.showAlert('error', 'Reset failed', data.message || 'Please try again');
            }
        } catch (error) {
            this.hideLoading();
            this.showAlert('error', 'Connection error', 'Please check your internet connection');
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${this.apiUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.redirectToUserDashboard(data.user.role);
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            localStorage.removeItem('authToken');
        }
    }

    redirectToUserDashboard(role) {
        const dashboards = {
            'admin': 'admin.html',
            'staff': 'staff.html',
            'customer': 'customer.html'
        };

        const dashboard = dashboards[role] || 'customer.html';
        window.location.href = dashboard;
    }

    showLoading(message) {
        let loader = document.getElementById('loadingSpinner');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingSpinner';
            loader.className = 'loading-spinner';
            document.body.appendChild(loader);
        }

        loader.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        loader.style.display = 'flex';
    }

    hideLoading() {
        const loader = document.getElementById('loadingSpinner');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showAlert(type, title, message) {
        const alertId = 'alert-' + Date.now();
        const alertDiv = document.createElement('div');
        alertDiv.id = alertId;
        alertDiv.className = `alert ${type}`;
        
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-times-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };

        alertDiv.innerHTML = `
            <div class="alert-content">
                <i class="alert-icon ${icons[type]}"></i>
                <div class="alert-message">
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    async logout() {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            try {
                await fetch(`${this.apiUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        localStorage.removeItem('authToken');
        localStorage.removeItem('rememberMe');
        this.currentUser = null;
        window.location.href = 'auth.html';
    }
}

// Add slideOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
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

// Initialize Authentication Manager
document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    
    // Make logout function globally available
    window.logout = () => authManager.logout();
});
