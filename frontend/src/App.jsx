import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';

const api = async (path, opts = {}) => {
  const token = localStorage.getItem('token');
  const r = await fetch('/api' + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: opts.body && JSON.stringify(opts.body) });
  const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Error'); return data;
};

function Home({ add }) {
  const [q, setQ] = useState(''), [books, setBooks] = useState([]);
  useEffect(() => { api('/books?q=' + encodeURIComponent(q)).then(setBooks).catch(() => {}); }, [q]);
  return <>
    <input placeholder="Search by title or author" value={q} onChange={e => setQ(e.target.value)} />
    <div className="grid">{books.map(b => <div className="card" key={b._id}>
      <h3><Link to={'/books/' + b._id}>{b.title}</Link></h3><p>{b.author}</p><p><b>₹{b.price}</b></p>
      <button className="btn" onClick={() => add(b)}>Add to cart</button></div>)}</div></>;
}
function Details({ add }) {
  const { id } = useParams(), [b, setB] = useState(null);
  useEffect(() => { api('/books/' + id).then(setB).catch(() => {}); }, [id]);
  return b ? <div className="card"><h2>{b.title}</h2><p>by {b.author} · {b.category}</p><p>{b.description}</p><p><b>₹{b.price}</b></p>
    <button className="btn" onClick={() => add(b)}>Add to cart</button></div> : <p>Loading...</p>;
}
function Cart({ cart, setCart }) {
  const [msg, setMsg] = useState(''), nav = useNavigate();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const order = async () => {
    try { await api('/orders', { method: 'POST', body: { items: cart.map(i => ({ book: i._id, title: i.title, price: i.price, qty: i.qty })) } }); setCart([]); nav('/orders'); }
    catch (e) { setMsg(e.message); }
  };
  return <div><h2>Cart</h2>{cart.length === 0 && <p>Your cart is empty.</p>}
    {cart.map(i => <div className="card" key={i._id}>{i.title} × {i.qty} = ₹{i.price * i.qty}</div>)}
    {cart.length > 0 && <><h3>Total: ₹{total}</h3><button className="btn" onClick={order}>Place order</button></>}<p className="err">{msg}</p></div>;
}
function Auth({ mode, onAuth }) {
  const [f, setF] = useState({ name: '', email: '', password: '' }), [err, setErr] = useState(''), nav = useNavigate();
  const submit = async () => { try { const d = await api('/' + mode, { method: 'POST', body: f }); onAuth(d); nav('/'); } catch (e) { setErr(e.message); } };
  return <div className="card" style={{ maxWidth: 360 }}><h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
    {mode === 'register' && <input placeholder="Name" onChange={e => setF({ ...f, name: e.target.value })} />}
    <input placeholder="Email" onChange={e => setF({ ...f, email: e.target.value })} />
    <input type="password" placeholder="Password" onChange={e => setF({ ...f, password: e.target.value })} />
    <button className="btn" onClick={submit}>Submit</button><p className="err">{err}</p></div>;
}
function Orders() {
  const [o, setO] = useState([]), [err, setErr] = useState('');
  useEffect(() => { api('/orders').then(setO).catch(e => setErr(e.message)); }, []);
  return <div><h2>My orders</h2><p className="err">{err}</p>{o.map(x => <div className="card" key={x._id}>
    <b>₹{x.total}</b> · {new Date(x.createdAt).toLocaleString()}<br />{x.items.map(i => i.title + ' ×' + i.qty).join(', ')}</div>)}</div>;
}
export default function App() {
  const [cart, setCart] = useState([]), [user, setUser] = useState(localStorage.getItem('name'));
  const add = b => setCart(c => c.find(i => i._id === b._id) ? c.map(i => i._id === b._id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...b, qty: 1 }]);
  const onAuth = d => { localStorage.setItem('token', d.token); localStorage.setItem('name', d.name); setUser(d.name); };
  const logout = () => { localStorage.clear(); setUser(null); };
  return <BrowserRouter><nav><Link to="/">📚 Bookstore</Link><Link to="/cart">Cart ({cart.length})</Link><Link to="/orders">Orders</Link><span className="spacer" />
    {user ? <><span style={{ color: '#fff' }}>Hi, {user}</span><button onClick={logout}>Logout</button></> : <><Link to="/login">Login</Link><Link to="/register">Register</Link></>}</nav>
    <main><Routes><Route path="/" element={<Home add={add} />} /><Route path="/books/:id" element={<Details add={add} />} />
      <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} /><Route path="/orders" element={<Orders />} />
      <Route path="/login" element={<Auth mode="login" onAuth={onAuth} />} /><Route path="/register" element={<Auth mode="register" onAuth={onAuth} />} /></Routes></main></BrowserRouter>;
}
