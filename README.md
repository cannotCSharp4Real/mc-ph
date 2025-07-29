# Coffee Shop Web Application

A full-stack web application for a coffee shop built with Node.js, Express, and MongoDB.

## Project Structure

```
mc-ph/
├── frontend/                 # Frontend files (HTML, CSS, JS, Images)
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   └── images/              # Images and assets
├── backend/                 # Backend API
│   ├── config/              # Configuration files
│   │   └── database.js      # MongoDB connection
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User management routes
│   │   ├── products.js      # Product management routes
│   │   └── orders.js        # Order management routes
│   ├── models/              # Database models
│   ├── controllers/         # Route controllers
│   └── middleware/          # Custom middleware
├── server.js                # Main server file
├── package.json             # Project dependencies
├── .env                     # Environment variables
├── .env.example             # Environment variables template
└── README.md               # This file
```

## Features

- User authentication and authorization
- Product catalog management
- Order management system
- RESTful API design
- MongoDB database integration
- Security middleware (Helmet, CORS, Rate limiting)
- Input validation
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mc-ph
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your actual configuration values.

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the application:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin)

## Environment Variables

Key environment variables you need to configure:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- Security headers with Helmet

## Development

To add new features:

1. Create new route files in `backend/routes/`
2. Add corresponding controllers in `backend/controllers/`
3. Update `server.js` to include new routes
4. Add frontend files in the `frontend/` directory

## Next Steps

1. Install dependencies: `npm install`
2. Configure your `.env` file
3. Set up your MongoDB database
4. Create your frontend HTML, CSS, and JavaScript files
5. Add authentication middleware for protected routes
6. Implement frontend-backend integration
7. Add payment processing (Stripe integration)
8. Add email notifications
9. Add comprehensive testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.