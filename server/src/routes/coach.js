import express from 'express';
import { z } from 'zod';
import ChatMessage from '../models/ChatMessage.js';
import Expense from '../models/Expense.js';
import IncomeRecord from '../models/IncomeRecord.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Loan from '../models/Loan.js';
import BillReminder from '../models/BillReminder.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';
import { getAIProvider, getAIStatus } from '../services/ai/index.js';
import {
  monthlyIncome, totalExpenses, expensesByCategory, budgetSummary,
  requiredMonthlyContribution, monthlyLoanCommitments, upcomingDues, toYearMonth
} from '../services/financeEngine.js';

const router = express.Router();
router.use(authenticate, attachFamily);

async function buildContext(req, month) {
  const [incomeRecords, expenses, budget, goals, loans, reminders] = await Promise.all([
    IncomeRecord.find({ familyId: req.family._id }),
    Expense.find({ familyId: req.family._id, $or: [{ visibility: 'family' }, { addedBy: req.user._id }] }),
    Budget.findOne({ familyId: req.family._id, month }),
    SavingsGoal.find({ familyId: req.family._id }),
    Loan.find({ familyId: req.family._id, status: 'active' }),
    BillReminder.find({ familyId: req.family._id, status: 'pending' }),
  ]);

  const incomeResult = monthlyIncome(incomeRecords, month);
  const spent = totalExpenses(expenses, month);
  const remaining = incomeResult.total - spent;
  const byCategory = expensesByCategory(expenses, month);
  const bSum = budgetSummary(expenses, budget, month);

  const topCategories = byCategory;
  const budgetAlerts = bSum.categories.filter(c => c.status !== 'ok' && c.status !== 'no-limit');

  const goalsSummary = goals.map(g => {
    const plan = requiredMonthlyContribution(g.targetAmount, g.savedAmount, g.deadline);
    return {
      name: g.name,
      savedAmount: g.savedAmount,
      targetAmount: g.targetAmount,
      deadline: g.deadline,
      requiredMonthly: plan.required,
      months: plan.months,
    };
  });

  const upcomingDuesList = upcomingDues(reminders, loans, 30).map(d => ({
    title: d.title,
    amount: d.amount,
    daysUntilDue: d.daysUntilDue,
  }));

  return {
    month,
    income: incomeResult.total,
    incomeIsEstimate: incomeResult.isEstimate,
    spent,
    remaining,
    topCategories,
    budgetAlerts,
    goalsSummary,
    upcomingDues: upcomingDuesList,
    monthlyEmi: monthlyLoanCommitments(loans),
  };
}

// POST /coach/chat
router.post('/chat', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const { message } = z.object({ message: z.string().min(1).max(1000) }).parse(req.body);
    const month = req.query.month || toYearMonth(new Date());
    const language = req.user.preferredLanguage || 'en';

    // Get last 10 messages for context
    const history = await ChatMessage.find({ familyId: req.family._id })
      .sort({ createdAt: -1 }).limit(10).lean();
    const historyFormatted = history.reverse().map(m => ({ role: m.role, content: m.content }));

    // Save user message
    await ChatMessage.create({
      familyId: req.family._id,
      userId: req.user._id,
      role: 'user',
      content: message,
    });

    const context = await buildContext(req, month);
    const messagesForAI = [...historyFormatted, { role: 'user', content: message }];

    const provider = getAIProvider();
    const response = await provider.chat(messagesForAI, context, language);

    // Save assistant message
    await ChatMessage.create({
      familyId: req.family._id,
      userId: req.user._id,
      role: 'assistant',
      content: response.text,
      mode: response.mode,
    });

    return res.json({ reply: response.text, mode: response.mode, context: { remaining: context.remaining, income: context.income } });
  } catch (err) { next(err); }
});

// GET /coach/history
router.get('/history', async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ familyId: req.family._id }).sort({ createdAt: 1 }).limit(50);
    return res.json({ messages });
  } catch (err) { next(err); }
});

// DELETE /coach/history
router.delete('/history', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    await ChatMessage.deleteMany({ familyId: req.family._id });
    return res.json({ message: 'Chat history cleared' });
  } catch (err) { next(err); }
});

// GET /coach/insights
router.get('/insights', async (req, res, next) => {
  try {
    const month = req.query.month || toYearMonth(new Date());
    const context = await buildContext(req, month);
    const provider = getAIProvider();
    const language = req.user.preferredLanguage || 'en';
    const insights = await provider.generateInsights(context, language);
    const status = getAIStatus();
    return res.json({ insights, mode: status.mode });
  } catch (err) { next(err); }
});

export default router;
