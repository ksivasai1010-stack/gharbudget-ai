import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'adult', 'viewer'], default: 'adult' },
  status: { type: String, enum: ['active', 'pending', 'removed'], default: 'active' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

membershipSchema.index({ familyId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);
