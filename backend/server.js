const express = require('express'), mongoose = require('mongoose'), cors = require('cors');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), prom = require('prom-client');
const app = express(); app.use(cors(), express.json());
const SECRET = process.env.JWT_SECRET || 'dev-secret';
prom.collectDefaultMetrics();
const reqCount = new prom.Counter({ name: 'http_requests_total', help: 'Total requests', labelNames: ['method', 'status'] });
app.use((req, res, next) => { res.on('finish', () => reqCount.inc({ method: req.method, status: res.statusCode })); next(); });

const User = mongoose.model('User', new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String }));
const Book = mongoose.model('Book', new mongoose.Schema({ title: String, author: String, price: Number, category: String, description: String }));
const Order = mongoose.model('Order', new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId, total: Number, createdAt: { type: Date, default: Date.now },
  items: [{ book: mongoose.Schema.Types.ObjectId, title: String, price: Number, qty: Number }] }));

const auth = (req, res, next) => {
  try { req.userId = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Login required' }); }
};

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.get('/metrics', async (_, res) => { res.set('Content-Type', prom.register.contentType); res.end(await prom.register.metrics()); });

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.json({ token: jwt.sign({ id: u._id }, SECRET), name });
  } catch { res.status(400).json({ error: 'Email already registered or invalid data' }); }
});
app.post('/api/login', async (req, res) => {
  const u = await User.findOne({ email: req.body.email });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: jwt.sign({ id: u._id }, SECRET), name: u.name });
});
app.get('/api/books', async (req, res) => {
  const q = req.query.q ? new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  res.json(await Book.find(q ? { $or: [{ title: q }, { author: q }] } : {}));
});
app.get('/api/books/:id', async (req, res) => {
  const b = await Book.findById(req.params.id).catch(() => null);
  b ? res.json(b) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/orders', auth, async (req, res) => {
  const items = req.body.items || [];
  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  res.json(await Order.create({ user: req.userId, items, total }));
});
app.get('/api/orders', auth, async (req, res) => res.json(await Order.find({ user: req.userId }).sort('-createdAt')));

async function seed() {
  if (await Book.countDocuments()) return;
  await Book.insertMany([
    { title: 'Java Programming', author: 'Herbert Schildt', price: 450, category: 'Programming', description: 'Complete guide to Java.' },
    { title: 'Clean Code', author: 'Robert C. Martin', price: 520, category: 'Programming', description: 'Writing readable, maintainable code.' },
    { title: 'Docker Deep Dive', author: 'Nigel Poulton', price: 600, category: 'DevOps', description: 'Containers explained.' },
    { title: 'The Phoenix Project', author: 'Gene Kim', price: 399, category: 'DevOps', description: 'A novel about IT and DevOps.' },
    { title: 'Kubernetes Up & Running', author: 'Kelsey Hightower', price: 700, category: 'DevOps', description: 'Run apps on Kubernetes.' },
    { title: 'Atomic Habits', author: 'James Clear', price: 350, category: 'Self-help', description: 'Build good habits.' }]);
}
module.exports = app;
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    .then(seed).then(() => app.listen(process.env.PORT || 5000, () => console.log('API running')))
    .catch(e => { console.error(e); process.exit(1); });
}
