import mongoose from 'mongoose';

const incomeRecordSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  source: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 1 }, // integer paise
  frequency: { type: String, enum: ['monthly', 'weekly', 'one-time'], default: 'monthly' },
  month: { type: String }, // YYYY-MM, null means recurring
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

incomeRecordSchema.index({ familyId: 1, month: 1 });

export default mongoose.model('IncomeRecord', incomeRecordSchema);
