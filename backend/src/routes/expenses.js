import { Router } from 'express';
import Expense from '../models/Expense.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const r = Router();

function serialize(e) {
  return {
    id: e._id,
    category_id: e.category_id,
    item_name: e.item_name,
    quantity: e.quantity,
    price: e.price,
    vendor: e.vendor,
    description: e.description,
    purchase_date: e.purchase_date,
    payment_method: e.payment_method,
    bill_path: e.bill_path,
    status: e.status,
    allotted_to: e.allotted_to,
    dispatch_date: e.dispatch_date,
    approval_note: e.approval_note,
    approved_at: e.approved_at,
    added_by: e.added_by?._id || e.added_by,
    added_by_name: e.added_by?.display_name || null,
    approved_by_name: e.approved_by?.display_name || null,
    created_at: e.createdAt,
  };
}

r.get('/', requireAuth, async (req, res) => {
  const { category_id, status } = req.query;
  const q = {};
  if (category_id) q.category_id = category_id;
  if (status) q.status = status;
  const list = await Expense.find(q)
    .sort({ purchase_date: -1, createdAt: -1 })
    .populate('added_by', 'display_name')
    .populate('approved_by', 'display_name');
  res.json(list.map(serialize));
});

r.post('/', requireAuth, upload.single('bill'), async (req, res) => {
  const b = req.body;
  const doc = await Expense.create({
    category_id: b.category_id,
    item_name: b.item_name,
    quantity: Number(b.quantity) || 1,
    price: Number(b.price) || 0,
    vendor: b.vendor || '',
    description: b.description || '',
    purchase_date: b.purchase_date,
    payment_method: b.payment_method || 'cash',
    allotted_to: b.allotted_to || '',
    dispatch_date: b.dispatch_date || '',
    bill_path: req.file ? `/uploads/${req.file.filename}` : null,
    added_by: req.user._id,
    status: 'approved',
    approved_by: req.user._id,
    approved_at: new Date(),
  });
  res.json(serialize(doc));
});

r.patch('/:id', requireAuth, upload.single('bill'), async (req, res) => {
  const e = await Expense.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  const b = req.body;
  for (const k of ['item_name','vendor','description','purchase_date','payment_method','allotted_to','dispatch_date']) if (b[k] !== undefined) e[k] = b[k];
  if (b.quantity !== undefined) e.quantity = Number(b.quantity);
  if (b.price !== undefined) e.price = Number(b.price);
  if (b.category_id) e.category_id = b.category_id;
  if (req.file) e.bill_path = `/uploads/${req.file.filename}`;
  // Expenses are auto-approved, no need to reset to pending on edit
  await e.save();
  res.json(serialize(e));
});

r.delete('/:id', requireAuth, async (req, res) => {
  const e = await Expense.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  await e.deleteOne();
  res.json({ ok: true });
});

r.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const e = await Expense.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  e.status = 'approved';
  e.approved_by = req.user._id;
  e.approved_at = new Date();
  e.approval_note = req.body?.note || '';
  await e.save();
  res.json(serialize(e));
});

r.post('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const e = await Expense.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  e.status = 'rejected';
  e.approved_by = req.user._id;
  e.approved_at = new Date();
  e.approval_note = req.body?.note || '';
  await e.save();
  res.json(serialize(e));
});

export default r;
