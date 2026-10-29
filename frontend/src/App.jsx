import { useState, useEffect } from 'react'
const API = import.meta.env.VITE_API || 'http://localhost:5000/api'
const CATS = ['Electronics', 'Fashion', 'Home', 'Books']
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const inr = n => '₹' + n.toLocaleString('en-IN')

function Auth({ call, onDone }) {
  const [reg, setReg] = useState(false), [f, setF] = useState({ name: '', email: '', password: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  return <div className="box"><h2>{reg ? 'Register' : 'Login'}</h2>
    {reg && <input placeholder="Name" value={f.name} onChange={set('name')} />}
    <input placeholder="Email" value={f.email} onChange={set('email')} />
    <input type="password" placeholder="Password (6+ chars)" value={f.password} onChange={set('password')} />
    <button onClick={() => call(reg ? '/auth/register' : '/auth/login', 'POST', f).then(onDone)}>{reg ? 'Create account' : 'Login'}</button>
    <a onClick={() => setReg(!reg)} style={{ cursor: 'pointer' }}>{reg ? 'Have an account? Login' : 'New here? Register'}</a></div>
}

function Cart({ cart, setCart, user, call, go, done }) {
  const [address, setAddress] = useState('')
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const upd = (id, d) => setCart(cart.map(i => i._id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))
  const order = () => call('/orders', 'POST', { address, items: cart.map(i => ({ productId: i._id, qty: i.qty })) })
    .then(() => { setCart([]); done('Order placed successfully (mock payment)!'); go('orders') })
  if (!cart.length) return <p>Your cart is empty.</p>
  return <div><h2>Cart</h2>
    {cart.map(i => <div className="row" key={i._id}><span>{i.name}</span>
      <span><button className="alt" onClick={() => upd(i._id, -1)}>-</button> {i.qty} <button className="alt" onClick={() => upd(i._id, 1)}>+</button></span>
      <span>{inr(i.price * i.qty)}</span><button className="alt" onClick={() => setCart(cart.filter(x => x._id !== i._id))}>Remove</button></div>)}
    <h3>Total: {inr(total)}</h3>
    {user ? <div className="box"><h3>Checkout</h3><textarea placeholder="Delivery address" value={address} onChange={e => setAddress(e.target.value)} />
      <button onClick={order}>Place order (mock payment)</button></div>
      : <button onClick={() => go('login')}>Login to checkout</button>}</div>
}

function Orders({ call }) {
  const [o, setO] = useState([])
  useEffect(() => { call('/orders/mine').then(setO) }, [])
  return <div><h2>My orders</h2>{!o.length && <p>No orders yet.</p>}
    {o.map(x => <div className="row" key={x._id}><span>{new Date(x.createdAt).toLocaleDateString()}<br />{x.items.map(i => `${i.name} x${i.qty}`).join(', ')}</span>
      <span>{inr(x.total)}<br /><small>{x.status}</small></span></div>)}</div>
}

export default function App() {
  const [view, setView] = useState('shop'), [products, setProducts] = useState([])
  const [q, setQ] = useState(''), [cat, setCat] = useState(''), [msg, setMsg] = useState('')
  const [cart, setCart] = useState(() => load('cart', [])), [user, setUser] = useState(() => load('user', null))
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('user', JSON.stringify(user)), [user])
  useEffect(() => { fetch(`${API}/products?search=${encodeURIComponent(q)}&category=${cat}`).then(r => r.json()).then(setProducts).catch(() => setMsg('Cannot reach the server')) }, [q, cat])
  const call = async (path, method = 'GET', body) => {
    try {
      const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(user && { Authorization: 'Bearer ' + user.token }) }, body: body && JSON.stringify(body) })
      const d = await r.json(); if (!r.ok) throw new Error(d.message); return d
    } catch (e) { setMsg(e.message); throw e }
  }
  const add = p => { setMsg(''); setCart(c => c.find(i => i._id === p._id) ? c.map(i => i._id === p._id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1 }]) }
  const go = v => { setMsg(''); setView(v) }
  return <>
    <nav><b onClick={() => go('shop')}>🛒 ShopEZ</b><a onClick={() => go('shop')}>Shop</a>
      <a onClick={() => go('cart')}>Cart ({cart.reduce((s, i) => s + i.qty, 0)})</a>
      {user ? <><a onClick={() => go('orders')}>Orders</a><span>Hi, {user.name}</span><a onClick={() => { setUser(null); go('shop') }}>Logout</a></> : <a onClick={() => go('login')}>Login</a>}</nav>
    <main>{msg && <div className="msg">{msg}</div>}
      {view === 'shop' && <><div className="bar"><input placeholder="Search products..." value={q} onChange={e => setQ(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="grid">{products.map(p => <div className="card" key={p._id}><img src={p.image} alt={p.name} /><div><b>{p.name}</b><p>{p.description}</p>
          <span className="price">{inr(p.price)}</span> <button onClick={() => add(p)}>Add to cart</button></div></div>)}</div>
        {!products.length && <p>No products found.</p>}</>}
      {view === 'cart' && <Cart {...{ cart, setCart, user, call, go }} done={setMsg} />}
      {view === 'login' && <Auth call={call} onDone={u => { setUser(u); go('shop') }} />}
      {view === 'orders' && (user ? <Orders call={call} /> : <Auth call={call} onDone={u => { setUser(u); go('orders') }} />)}</main></>
}
