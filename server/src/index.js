import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { sanitize, errorHandler, notFound } from './middleware/common.js';
import { getAIStatus } from './services/ai/index.js';

// Routes
import authRouter from './routes/auth.js';
import familiesRouter from './routes/families.js';
import incomeRouter from './routes/income.js';
import expensesRouter from './routes/expenses.js';
import budgetsRouter from './routes/budgets.js';
import goalsRouter from './routes/goals.js';
import loansRouter from './routes/loans.js';
import remindersRouter from './routes/reminders.js';
import dashboardRouter from './routes/dashboard.js';
import coachRouter from './routes/coach.js';
import educationRouter from './routes/education.js';

const app = express();

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: { code: 'RATE_LIMITED', message: 'AI rate limit reached. Please wait.' } } });
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/coach', aiLimiter);
app.use('/api/v1/expenses/parse', aiLimiter);
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitize);

// Routes
const api = express.Router();

api.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
api.get('/ai/status', (req, res) => res.json(getAIStatus()));

api.use('/auth', authRouter);
api.use('/families', familiesRouter);
api.use('/income', incomeRouter);
api.use('/expenses', expensesRouter);
api.use('/budgets', budgetsRouter);
api.use('/goals', goalsRouter);
api.use('/loans', loansRouter);
api.use('/reminders', remindersRouter);
api.use('/dashboard', dashboardRouter);
api.use('/coach', coachRouter);
api.use('/lessons', educationRouter);

app.use('/api/v1', api);
app.use(notFound);
app.use(errorHandler);

export default app;

// Start server (only when run directly, not during tests)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(config.port, () => {
      console.log(`GharBudget AI server running on port ${config.port}`);
      console.log(`AI Provider: ${getAIStatus().provider} (${getAIStatus().mode})`);
    });
  }).catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
}
