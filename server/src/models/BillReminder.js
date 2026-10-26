import mongoose from 'mongoose';

const billReminderSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, min: 0 }, // integer paise, optional
  dueDate: { type: Date, required: true },
  recurrence: { type: String, enum: ['none', 'monthly', 'yearly'], default: 'none' },
  category: { type: String, default: 'Others' },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  linkedLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

billReminderSchema.index({ familyId: 1, dueDate: 1 });

export default mongoose.model('BillReminder', billReminderSchema);
