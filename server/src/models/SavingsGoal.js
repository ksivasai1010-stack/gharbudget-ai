import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['school_fees', 'medical', 'festival', 'insurance', 'vehicle', 'household', 'emergency', 'other'],
    default: 'other',
  },
  targetAmount: { type: Number, required: true, min: 1 }, // integer paise
  savedAmount: { type: Number, default: 0, min: 0 }, // integer paise
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  visibility: { type: String, enum: ['family', 'private'], default: 'family' },
  contributions: [{
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

savingsGoalSchema.index({ familyId: 1, deadline: 1 });

export default mongoose.model('SavingsGoal', savingsGoalSchema);
