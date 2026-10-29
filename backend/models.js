const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = mongoose.model('User', new Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, default: 'customer' } }));
const Product = mongoose.model('Product', new Schema({
  name: String, description: String, price: Number, category: String, image: String,
  stock: { type: Number, default: 100 } }));
const Order = mongoose.model('Order', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{ product: Schema.Types.ObjectId, name: String, price: Number, qty: Number }],
  total: Number, address: String, status: { type: String, default: 'Paid (mock)' } }, { timestamps: true }));
module.exports = { User, Product, Order };
