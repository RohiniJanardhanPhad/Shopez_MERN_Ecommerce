require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User, Product } = require('./models');
const productImages = require('./product-images');
const items = [
 ['Wireless Headphones','Electronics',2499],['Smart Watch','Electronics',3999],['Bluetooth Speaker','Electronics',1799],['Power Bank 10000mAh','Electronics',1199],
 ['Cotton T-Shirt','Fashion',499],['Denim Jacket','Fashion',1999],['Running Shoes','Fashion',2799],['Backpack','Fashion',1299],
 ['Table Lamp','Home',899],['Coffee Mug Set','Home',599],['Wall Clock','Home',749],['Cushion Cover Pack','Home',399],
 ['Atomic Habits','Books',449],['Clean Code','Books',899],['The Alchemist','Books',299],['Python Crash Course','Books',699]];
(async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required. Copy backend/.env.example to backend/.env and set MONGO_URI.');
  await mongoose.connect(mongoUri);
  await Product.deleteMany({}); await User.deleteMany({});
  await Product.insertMany(items.map(([name, category, price]) => ({ name, category, price,
    description: `${name} - quality product from ShopEZ.`, image: productImages[name] })));
  await User.create({ name: 'Admin', email: 'admin@shopez.com', password: await bcrypt.hash('admin123', 10), role: 'admin' });
  console.log('Seeded 16 products + admin (admin@shopez.com / admin123)'); process.exit();
})();
