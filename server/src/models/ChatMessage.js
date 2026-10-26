import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  mode: { type: String, enum: ['live', 'fallback', 'demo'], default: 'fallback' },
  createdAt: { type: Date, default: Date.now },
});

chatMessageSchema.index({ familyId: 1, createdAt: -1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
