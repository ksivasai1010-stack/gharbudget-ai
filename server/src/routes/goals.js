import express from 'express';
import { z } from 'zod';
import SavingsGoal from '../models/SavingsGoal.js';
import Expense from '../models/Expense.js';
import IncomeRecord from '../models/IncomeRecord.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';
import { requiredMonthlyContribution, goalAffordability, combinedGoalAffordability, monthlyIncome, totalExpenses } from '../services/financeEngine.js';
import { toYearMonth } from '../services/financeEngine.js';

const router = express.Router();
router.use(authenticate, attachFamily);

const goalSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['school_fees', 'medical', 'festival', 'insurance', 'vehicle', 'household', 'emergency', 'other']),
  targetAmount: z.number().int().positive(),
  savedAmount: z.number().int().min(0).optional(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  visibility: z.enum(['family', 'private']).optional(),
});

// GET /goals
router.get('/', async (req, res, next) => {
  try {
    const query = { familyId: req.family._id };
    if (req.role === 'viewer') query.visibility = 'family';
    const goals = await SavingsGoal.find(query).sort({ priority: 1, deadline: 1 });
    return res.json({ goals });
  } catch (err) { next(err); }
});

// POST /goals
router.post('/', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = goalSchema.parse(req.body);
    const goal = await SavingsGoal.create({ ...data, deadline: new Date(data.deadline), familyId: req.family._id, addedBy: req.user._id });
    return res.status(201).json({ goal });
  } catch (err) { next(err); }
});

// GET /goals/:id
router.get('/:id', async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, familyId: req.family._id });
    if (!goal) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } });
    return res.json({ goal });
  } catch (err) { next(err); }
});

// PATCH /goals/:id
router.patch('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = goalSchema.partial().parse(req.body);
    if (data.deadline) data.deadline = new Date(data.deadline);
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, familyId: req.family._id },
      data, { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } });
    return res.json({ goal });
  } catch (err) { next(err); }
});

// DELETE /goals/:id
router.delete('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, familyId: req.family._id });
    if (!goal) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } });
    return res.json({ message: 'Goal deleted' });
  } catch (err) { next(err); }
});

// POST /goals/:id/contribute
router.post('/:id/contribute', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const { amount } = z.object({ amount: z.number().int().positive() }).parse(req.body);
    const goal = await SavingsGoal.findOne({ _id: req.params.id, familyId: req.family._id });
    if (!goal) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } });

    goal.savedAmount += amount;
    goal.contributions.push({ amount, date: new Date(), by: req.user._id });
    await goal.save();
    return res.json({ goal });
  } catch (err) { next(err); }
});

// GET /goals/:id/plan
router.get('/:id/plan', async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, familyId: req.family._id });
    if (!goal) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } });

    const month = toYearMonth(new Date());
    const [expenses, incomeRecords, allGoals] = await Promise.all([
      Expense.find({ familyId: req.family._id }),
      IncomeRecord.find({ familyId: req.family._id }),
      SavingsGoal.find({ familyId: req.family._id }),
    ]);

    const incomeResult = monthlyIncome(incomeRecords, month);
    const spent = totalExpenses(expenses, month);
    const remaining = incomeResult.total - spent;

    const plan = requiredMonthlyContribution(goal.targetAmount, goal.savedAmount, goal.deadline);
    const affordability = goalAffordability(remaining, plan.required);
    const combined = combinedGoalAffordability(allGoals, remaining);

    return res.json({ goal, plan, affordability, combined, remaining, income: incomeResult.total, spent });
  } catch (err) { next(err); }
});

export default router;
