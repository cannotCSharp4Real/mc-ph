document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const signInTab = document.getElementById('signInTab');
    const registerTab = document.getElementById('registerTab');
    const signInForm = document.getElementById('signInForm');
    const registerForm = document.getElementById('registerForm');
    const signInFormElement = document.getElementById('signInFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    const messageContainer = document.getElementById('messageContainer');
    const forgotPassword = document.getElementById('forgotPassword');
    
    // Tab switching functionality
    signInTab.addEventListener('click', () => switchTab('signIn'));
    registerTab.addEventListener('click', () => switchTab('register'));
    
    // Form submissions
    signInFormElement.addEventListener('submit', handleSignIn);
    registerFormElement.addEventListener('submit', handleRegister);
    
    // Forgot password
    forgotPassword.addEventListener('click', handleForgotPassword);
    
    // Input validation
    setupInputValidation();
    
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Functions
    function switchTab(tab) {
        if (tab === 'signIn') {
            signInTab.classList.add('active');
            registerTab.classList.remove('active');
            signInForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerTab.classList.add('active');
            signInTab.classList.remove('active');
            registerForm.classList.remove('hidden');
            signInForm.classList.add('hidden');
        }
        clearMessages();
    }
    
    function showMessage(message, type = 'info') {
        messageContainer.className = `message-container ${type}`;
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 3000);
        }
    }
    
    function clearMessages() {
        messageContainer.style.display = 'none';
        messageContainer.className = 'message-container';
    }
    
    function showLoading(button) {
        button.disabled = true;
        button.classList.add('loading');
        button.textContent = '';
    }
    
    function hideLoading(button, originalText) {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = originalText;
    }
    
    async function handleSignIn(e) {
        e.preventDefault();
        
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        const submitBtn = document.getElementById('signInBtn');
        
        // Basic validation
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        showLoading(submitBtn);
        clearMessages();
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                showMessage('Sign in successful! Redirecting...', 'success');
                
                // Redirect based on user role or server redirect path
                setTimeout(() => {
                    const redirectPath = data.redirectTo || 'index.html';
                    window.location.href = redirectPath;
                }, 1500);
            } else {
                showMessage(data.message || 'Sign in failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            showMessage('Connection error. Please try again.', 'error');
        } finally {
            hideLoading(submitBtn, 'Sign In');
        }
    }
    
    async function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('registerBtn');
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        showLoading(submitBtn);
        clearMessages();
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                showMessage('Registration successful! Redirecting...', 'success');
                
                // Redirect to landing page after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showMessage(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Connection error. Please try again.', 'error');
        } finally {
            hideLoading(submitBtn, 'Register');
        }
    }
    
    function handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value;
        
        if (!email) {
            showMessage('Please enter your email address first', 'error');
            return;
        }
        
        // For now, just show a message (you can implement actual password reset later)
        showMessage('Password reset instructions will be sent to your email', 'info');
    }
    
    function setupInputValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateEmail(this);
            });
        });
        
        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', function() {
                validatePassword(this);
            });
        });
        
        // Confirm password validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                validateConfirmPassword(this);
            });
        }
    }
    
    function validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(input.value);
        
        if (input.value && !isValid) {
            input.classList.add('error');
            input.classList.remove('success');
            showFieldError(input, 'Please enter a valid email address');
        } else if (input.value && isValid) {
            input.classList.remove('error');
            input.classList.add('success');
            hideFieldError(input);
        } else {
            input.classList.remove('error', 'success');
            hideFieldError(input);
        }
    }
    
    function validatePassword(input) {
        const password = input.value;
        const strength = calculatePasswordStrength(password);
        
        if (password.length > 0) {
            if (password.length < 6) {
                input.classList.add('error');
                input.classList.remove('success');
                showFieldError(input, 'Password must be at least 6 characters long');
            } else {
                input.classList.remove('error');
                input.classList.add('success');
                hideFieldError(input);
            }
        } else {
            input.classList.remove('error', 'success');
            hideFieldError(input);
        }
    }
    
    function validateConfirmPassword(input) {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = input.value;
        
        if (confirmPassword && password !== confirmPassword) {
            input.classList.add('error');
            input.classList.remove('success');
            showFieldError(input, 'Passwords do not match');
        } else if (confirmPassword && password === confirmPassword) {
            input.classList.remove('error');
            input.classList.add('success');
            hideFieldError(input);
        } else {
            input.classList.remove('error', 'success');
            hideFieldError(input);
        }
    }
    
    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]/)) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
        return strength;
    }
    
    function showFieldError(input, message) {
        hideFieldError(input);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        input.parentNode.appendChild(errorElement);
    }
    
    function hideFieldError(input) {
        const errorElement = input.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    function checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // User is already authenticated, redirect to landing page
            window.location.href = 'index.html';
        }
    }
    
    // Social media links functionality
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const platform = this.textContent.toLowerCase();
            
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
    
    // Enter key handling for better UX
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeForm = document.querySelector('.auth-form-wrapper:not(.hidden)');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('.auth-btn');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }
    });
});