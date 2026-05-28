import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  display_name: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
