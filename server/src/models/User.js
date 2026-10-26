import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  preferredLanguage: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
