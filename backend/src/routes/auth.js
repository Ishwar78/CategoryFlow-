import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();

function sign(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
}
function publicUser(u) {
  return { id: u._id, email: u.email, display_name: u.display_name, role: u.role, approved: u.approved };
}

r.post('/signup', async (req, res) => {
  const { email, password, display_name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 chars' });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const isFirst = (await User.countDocuments()) === 0;
  const user = await User.create({
    email: email.toLowerCase(),
    password_hash: await bcrypt.hash(password, 10),
    display_name: display_name || email.split('@')[0],
    role: isFirst ? 'admin' : 'employee',
    approved: isFirst ? true : false,
  });
  if (!user.approved) {
    return res.json({ token: null, user: publicUser(user), message: 'Account created! Pending admin approval.' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.approved && user.role !== 'admin') {
    return res.status(403).json({ error: 'Your account is pending admin approval' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

r.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

r.get('/users/pending', requireAuth, requireAdmin, async (req, res) => {
  const list = await User.find({ approved: false }).sort({ createdAt: -1 });
  res.json(list.map(publicUser));
});

r.post('/users/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.approved = true;
  await user.save();
  res.json({ ok: true });
});

r.post('/users/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.deleteOne();
  res.json({ ok: true });
});

export default r;
