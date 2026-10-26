import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  lender: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['home', 'personal', 'vehicle', 'education', 'business', 'gold', 'other'],
    default: 'other',
  },
  principal: { type: Number, required: true, min: 1 }, // integer paise
  outstandingBalance: { type: Number, required: true, min: 0 }, // integer paise
  interestRate: { type: Number, min: 0 }, // annual %
  emiAmount: { type: Number, required: true, min: 1 }, // integer paise
  emiDayOfMonth: { type: Number, min: 1, max: 31, required: true },
  startDate: { type: Date },
  tenureMonths: { type: Number, min: 1 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

loanSchema.index({ familyId: 1, status: 1 });

export default mongoose.model('Loan', loanSchema);
