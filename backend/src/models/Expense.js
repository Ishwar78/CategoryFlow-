import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  item_name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  vendor: { type: String, default: '' },
  description: { type: String, default: '' },
  purchase_date: { type: String, required: true }, // YYYY-MM-DD
  payment_method: { type: String, default: 'cash' },
  bill_path: { type: String, default: null },
  added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  allotted_to: { type: String, default: '' },
  dispatch_date: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  approval_note: { type: String, default: '' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approved_at: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Expense', ExpenseSchema);
