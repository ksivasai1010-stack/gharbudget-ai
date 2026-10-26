import mongoose from 'mongoose';
import { CATEGORIES } from './constants.js';

const expenseSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 }, // integer paise
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORIES, required: true },
  date: { type: Date, required: true },
  paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'other'], default: 'cash' },
  visibility: { type: String, enum: ['family', 'private'], default: 'family' },
  source: { type: String, enum: ['manual', 'ai-parsed', 'voice'], default: 'manual' },
  createdAt: { type: Date, default: Date.now },
});

expenseSchema.index({ familyId: 1, date: -1 });
expenseSchema.index({ familyId: 1, category: 1, date: -1 });

export default mongoose.model('Expense', expenseSchema);
