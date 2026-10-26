import express from 'express';
import { z } from 'zod';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import IncomeRecord from '../models/IncomeRecord.js';
import { CATEGORIES } from '../models/constants.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';
import { budgetSummary, monthlyIncome, totalExpenses } from '../services/financeEngine.js';

const router = express.Router();
router.use(authenticate, attachFamily);

const monthParam = z.string().regex(/^\d{4}-\d{2}$/);

// GET /budgets/:month
router.get('/:month', async (req, res, next) => {
  try {
    monthParam.parse(req.params.month);
    const budget = await Budget.findOne({ familyId: req.family._id, month: req.params.month });
    return res.json({ budget: budget || null });
  } catch (err) { next(err); }
});

// PUT /budgets/:month
router.put('/:month', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    monthParam.parse(req.params.month);
    const { categoryLimits } = z.object({
      categoryLimits: z.array(z.object({
        category: z.enum(CATEGORIES),
        limit: z.number().int().min(0),
      })),
    }).parse(req.body);

    const totalPlanned = categoryLimits.reduce((s, c) => s + c.limit, 0);
    const budget = await Budget.findOneAndUpdate(
      { familyId: req.family._id, month: req.params.month },
      { categoryLimits, totalPlanned },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json({ budget });
  } catch (err) { next(err); }
});

// GET /budgets/:month/summary
router.get('/:month/summary', async (req, res, next) => {
  try {
    monthParam.parse(req.params.month);
    const month = req.params.month;

    const [budget, expenses, incomeRecords] = await Promise.all([
      Budget.findOne({ familyId: req.family._id, month }),
      Expense.find({ familyId: req.family._id, date: { $gte: new Date(`${month}-01`), $lt: new Date(`${month}-31`) } }),
      IncomeRecord.find({ familyId: req.family._id }),
    ]);

    const incomeResult = monthlyIncome(incomeRecords, month);
    const spent = totalExpenses(expenses, month);
    const summary = budgetSummary(expenses, budget, month);

    return res.json({
      month,
      income: incomeResult.total,
      spent,
      remaining: incomeResult.total - spent,
      budget: summary,
      exceedsIncome: summary.totalPlanned > incomeResult.total,
    });
  } catch (err) { next(err); }
});

export default router;
