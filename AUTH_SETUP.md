# 🔐 Authentication System Setup Guide

## Overview
The authentication system provides secure user registration and login functionality with JWT token-based authentication.

## Features
- ✅ User Registration with email and password
- ✅ Secure password hashing with bcrypt  
- ✅ JWT token-based authentication
- ✅ Form validation and error handling
- ✅ Responsive design matching the reference
- ✅ Protected routes and middleware
- ✅ Profile management capabilities

## Setup Instructions

### 1. Install Dependencies
```bash
npm install express cors bcrypt jsonwebtoken mongodb dotenv
```

### 2. Configure Environment Variables
The `.env` file is already configured with:
- MongoDB connection string
- JWT secret key
- Server port (3002)

### 3. Start the Server
```bash
npm start
```

### 4. Access the Authentication System
- **Landing Page**: `http://localhost:3002/`
- **Authentication**: `http://localhost:3002/auth.html`

## User Flow

### New Users (Registration)
1. Click "Sign In / Sign Up" on landing page
2. Switch to "Register" tab
3. Fill in: Full Name, Email, Password, Confirm Password
4. Submit form → Account created and logged in
5. Redirected to landing page with authenticated header

### Existing Users (Login)
1. Click "Sign In / Sign Up" on landing page
2. Stay on "Sign In" tab (default)
3. Enter: Email and Password
4. Submit form → Logged in
5. Redirected to landing page with authenticated header

## API Endpoints

### Authentication Routes (`/api/auth/`)
- `POST /register` - Create new user account
- `POST /login` - User login
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `PUT /change-password` - Change password (protected)
- `POST /logout` - User logout (protected)
- `GET /verify` - Verify JWT token (protected)

### Request/Response Examples

#### Registration
```javascript
// Request
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

// Response
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-07-15T10:30:00.000Z"
  },
  "token": "jwt_token_here"
}
```

#### Login
```javascript
// Request
POST /api/auth/login
{
  "email": "john@example.com", 
  "password": "securepassword123"
}

// Response
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "lastLogin": "2025-07-15T10:30:00.000Z"
  },
  "token": "jwt_token_here"
}
```

## Frontend Implementation

### Authentication State Management
- JWT token stored in `localStorage` as `authToken`
- User data stored in `localStorage` as `userData`
- Authentication status checked on page load
- Automatic redirect for authenticated users

### UI Components
- **Tab Navigation**: Switch between Sign In and Register
- **Form Validation**: Real-time input validation
- **Loading States**: Visual feedback during API calls
- **Error Messages**: User-friendly error display
- **Success Messages**: Confirmation messages

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- JWT token expiration (24 hours)
- Input sanitization and validation
- Protected routes with middleware
- Email format validation
- Password strength requirements (minimum 6 characters)

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean (default: true)
}
```

## Testing the System

### Test Registration
1. Open `http://localhost:3002/auth.html`
2. Click "Register" tab
3. Fill in test user details
4. Submit form
5. Check for successful registration and redirect

### Test Login
1. Go back to auth page
2. Use "Sign In" tab
3. Enter registered user credentials
4. Submit form
5. Verify successful login and redirect

### Test Authentication Flow
1. Visit landing page as guest
2. Click "Sign In / Sign Up"
3. Complete registration/login
4. Return to landing page
5. Verify header shows profile dropdown instead of sign-in button

## Troubleshooting

### Common Issues
1. **MongoDB Connection Error**: Check `.env` file and database connection
2. **JWT Token Issues**: Verify JWT_SECRET in environment variables
3. **CORS Errors**: Ensure frontend and backend are on same domain
4. **Form Validation**: Check browser console for JavaScript errors

### Debug Steps
1. Check browser console for errors
2. Verify server console logs
3. Test API endpoints directly
4. Check MongoDB connection
5. Verify environment variables

## Security Considerations

### Production Checklist
- [ ] Change JWT_SECRET to secure random string
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add password strength requirements
- [ ] Set up email verification
- [ ] Implement password reset functionality
- [ ] Add account lockout after failed attempts
- [ ] Use environment-specific configurations

The authentication system is now fully integrated and ready for use! 🎉
