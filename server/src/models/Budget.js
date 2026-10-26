import mongoose from 'mongoose';
import { CATEGORIES } from './constants.js';

const budgetSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  month: { type: String, required: true }, // YYYY-MM
  totalPlanned: { type: Number, default: 0 }, // integer paise
  categoryLimits: [{
    category: { type: String, enum: CATEGORIES },
    limit: { type: Number, min: 0 }, // integer paise
  }],
  createdAt: { type: Date, default: Date.now },
});

budgetSchema.index({ familyId: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
