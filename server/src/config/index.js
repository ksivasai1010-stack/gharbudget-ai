import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gharbudget',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiry: '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  ai: {
    provider: process.env.AI_PROVIDER || 'fallback',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    gemmaBaseUrl: process.env.GEMMA_BASE_URL || 'http://localhost:11434/v1',
    gemmaModel: process.env.GEMMA_MODEL || 'gemma3:4b',
    gemmaApiKey: process.env.GEMMA_API_KEY || '',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS) || 12000,
  },
};
