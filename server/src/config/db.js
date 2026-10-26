import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDB(uri) {
  const target = uri || config.mongoUri;
  await mongoose.connect(target, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`MongoDB connected: ${target}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
