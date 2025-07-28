# MongoDB Atlas + Render Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create free M0 cluster
- [ ] Create database user with read/write permissions
- [ ] Add IP address 0.0.0.0/0 to network access
- [ ] Get connection string

### 2. Environment Variables
- [ ] Copy your Atlas connection string
- [ ] Replace placeholder in render.yaml with actual connection string
- [ ] Format: `mongodb+srv://username:password@cluster.mongodb.net/coffee-shop?retryWrites=true&w=majority`

### 3. Test Local Connection (Optional)
- [ ] Create .env file with MONGODB_URI
- [ ] Run: `npm run setup-atlas` to initialize database
- [ ] Test: `npm start` to verify connection

## 🚀 Render Deployment Steps

### 4. Deploy to Render
- [ ] Go to render.com and sign up with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Connect your mc-ph repository
- [ ] Render will detect render.yaml automatically
- [ ] Click "Create Web Service"

### 5. Environment Variables in Render (Alternative Method)
If you prefer not to put the connection string in render.yaml:
- [ ] In Render dashboard, go to Environment
- [ ] Add: MONGODB_URI = your-atlas-connection-string
- [ ] Remove MONGODB_URI from render.yaml

### 6. Post-Deployment
- [ ] Check Render logs for successful deployment
- [ ] Visit your app URL
- [ ] Test database functionality
- [ ] Initialize database with sample data if needed

## 🔍 Troubleshooting

### Common Issues:
1. **Connection Timeout**: Check Atlas IP whitelist (should include 0.0.0.0/0)
2. **Authentication Failed**: Verify username/password in connection string
3. **Database Not Found**: The database will be created automatically on first connection
4. **Build Fails**: Check Render logs for specific errors

### Connection String Format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

Replace:
- `<username>`: Your Atlas database username
- `<password>`: Your Atlas database password  
- `<cluster>`: Your cluster name (e.g., cluster0.abc123)
- `<database>`: coffee-shop (or your preferred database name)

## 📞 Support Resources
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Render Docs: https://render.com/docs
- Your app will be live at: https://mc-ph-app.onrender.com
