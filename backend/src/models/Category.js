import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'package' },
  color: { type: String, default: 'blue' },
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
