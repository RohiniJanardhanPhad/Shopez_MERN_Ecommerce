# ShopEZ - MERN E-commerce App

## Run (needs Node.js 18+ and MongoDB running locally, or an Atlas URI)

In PowerShell, from the project root:
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run seed
npm start
```

The sample `.env` connects to MongoDB on your machine at `127.0.0.1:27017`. If you use MongoDB Atlas, replace `MONGO_URI` in `backend/.env` with your Atlas connection string. Set a private `JWT_SECRET` before deploying.

To refresh the demo catalog images without deleting products, users, or orders:
```powershell
cd backend
npm run update:product-images
```

In a separate terminal, start the frontend:
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.
Demo admin: admin@shopez.com / admin123 (customers: use Register)

## Features
Register/Login (bcrypt + JWT), product list, search, category filter, cart (add/remove/quantity, saved in browser),
checkout with mock payment, order history. Order totals are calculated on the server from DB prices.

## API
POST /api/auth/register | POST /api/auth/login | GET /api/products?search=&category= | GET /api/products/:id
POST /api/products (admin) | POST /api/orders (auth) | GET /api/orders/mine (auth)

## Data model
User(name,email,password,role) - Product(name,description,price,category,image,stock) - Order(user,items[],total,address,status)

## Deploy
Backend: Render (set MONGO_URI from MongoDB Atlas, JWT_SECRET). Frontend: Vercel/Netlify with VITE_API=https://<backend>/api
