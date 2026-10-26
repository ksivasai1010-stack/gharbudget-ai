import express from 'express';
import Expense from '../models/Expense.js';
import IncomeRecord from '../models/IncomeRecord.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Loan from '../models/Loan.js';
import BillReminder from '../models/BillReminder.js';
import { authenticate, attachFamily } from '../middleware/auth.js';
import { dashboardSummary, toYearMonth } from '../services/financeEngine.js';

const router = express.Router();
router.use(authenticate, attachFamily);

// GET /dashboard?month=YYYY-MM
router.get('/', async (req, res, next) => {
  try {
    const month = req.query.month || toYearMonth(new Date());

    const [incomeRecords, expenses, budget, goals, loans, reminders] = await Promise.all([
      IncomeRecord.find({ familyId: req.family._id }),
      Expense.find({
        familyId: req.family._id,
        $or: [{ visibility: 'family' }, { addedBy: req.user._id }],
      }),
      Budget.findOne({ familyId: req.family._id, month }),
      SavingsGoal.find({ familyId: req.family._id, visibility: 'family' }),
      Loan.find({ familyId: req.family._id, status: 'active' }),
      BillReminder.find({ familyId: req.family._id, status: 'pending' }),
    ]);

    const summary = dashboardSummary({
      incomeRecords,
      expenses,
      budget,
      goals,
      loans,
      reminders,
      month,
    });

    return res.json({ ...summary, family: req.family });
  } catch (err) { next(err); }
});

export default router;
