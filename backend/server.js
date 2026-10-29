require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'), cors = require('cors');
const { User, Product, Order } = require('./models');
const app = express(); app.use(cors()); app.use(express.json());

const sign = u => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Please log in' }); } };
const admin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
const wrap = f => (req, res) => f(req, res).catch(e => res.status(500).json({ message: e.message }));
const pub = u => ({ name: u.name, email: u.email, role: u.role, token: sign(u) });

app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a 6+ char password required' });
  if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
  res.json(pub(await User.create({ name, email, password: await bcrypt.hash(password, 10) })));
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: req.body.email });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(400).json({ message: 'Invalid email or password' });
  res.json(pub(u));
}));

app.get('/api/products', wrap(async (req, res) => {
  const { search, category } = req.query, f = {};
  if (search) f.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (category) f.category = category;
  res.json(await Product.find(f));
}));
app.get('/api/products/:id', wrap(async (req, res) => res.json(await Product.findById(req.params.id))));
app.post('/api/products', auth, admin, wrap(async (req, res) => res.json(await Product.create(req.body))));

// Totals are computed on the server from DB prices - never trusts the client.
app.post('/api/orders', auth, wrap(async (req, res) => {
  const { items, address } = req.body;
  if (!Array.isArray(items) || !items.length || !address) return res.status(400).json({ message: 'Cart and address required' });
  const prods = await Product.find({ _id: { $in: items.map(i => i.productId) } });
  const lines = [];
  for (const i of items) {
    const p = prods.find(x => String(x._id) === i.productId), qty = parseInt(i.qty);
    if (!p || !(qty > 0) || qty > p.stock) return res.status(400).json({ message: 'Invalid item or quantity' });
    lines.push({ product: p._id, name: p.name, price: p.price, qty });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  for (const l of lines) await Product.updateOne({ _id: l.product }, { $inc: { stock: -l.qty } });
  res.json(await Order.create({ user: req.user.id, items: lines, total, address }));
}));
app.get('/api/orders/mine', auth, wrap(async (req, res) => res.json(await Order.find({ user: req.user.id }).sort('-createdAt'))));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI is required. Copy backend/.env.example to backend/.env and set MONGO_URI.');
  process.exitCode = 1;
} else {
  mongoose.connect(mongoUri).then(() =>
    app.listen(process.env.PORT || 5000, () => console.log('ShopEZ API running'))).catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
