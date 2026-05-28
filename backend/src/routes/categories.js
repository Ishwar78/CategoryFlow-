import { Router } from 'express';
import Category from '../models/Category.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();

r.get('/', requireAuth, async (_req, res) => {
  const list = await Category.find().sort({ name: 1 });
  res.json(list.map(c => ({ id: c._id, name: c.name, slug: c.slug, description: c.description, icon: c.icon, color: c.color })));
});

r.post('/', requireAuth, requireAdmin, async (req, res) => {
  const c = await Category.create(req.body);
  res.json(c);
});

export default r;
