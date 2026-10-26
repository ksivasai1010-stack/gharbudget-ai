import express from 'express';
import { z } from 'zod';
import Loan from '../models/Loan.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';
import { monthlyLoanCommitments, loanProgress, calculateEmi } from '../services/financeEngine.js';

const router = express.Router();
router.use(authenticate, attachFamily);

const loanSchema = z.object({
  lender: z.string().min(1).max(100),
  type: z.enum(['home', 'personal', 'vehicle', 'education', 'business', 'gold', 'other']),
  principal: z.number().int().positive(),
  outstandingBalance: z.number().int().min(0),
  interestRate: z.number().min(0).max(100).optional(),
  emiAmount: z.number().int().positive(),
  emiDayOfMonth: z.number().int().min(1).max(31),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  tenureMonths: z.number().int().min(1).optional(),
  status: z.enum(['active', 'completed']).optional(),
});

// GET /loans
router.get('/', async (req, res, next) => {
  try {
    const loans = await Loan.find({ familyId: req.family._id }).sort({ createdAt: -1 });
    return res.json({ loans });
  } catch (err) { next(err); }
});

// POST /loans
router.post('/', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = loanSchema.parse(req.body);
    if (data.startDate) data.startDate = new Date(data.startDate);
    const loan = await Loan.create({ ...data, familyId: req.family._id, addedBy: req.user._id });
    return res.status(201).json({ loan });
  } catch (err) { next(err); }
});

// GET /loans/summary
router.get('/summary', async (req, res, next) => {
  try {
    const loans = await Loan.find({ familyId: req.family._id });
    const activeLoans = loans.filter(l => l.status === 'active');
    const monthlyEmi = monthlyLoanCommitments(loans);
    const totalOutstanding = activeLoans.reduce((s, l) => s + l.outstandingBalance, 0);
    const loansWithProgress = activeLoans.map(l => ({ ...l.toObject(), progress: loanProgress(l) }));
    return res.json({ monthlyEmi, totalOutstanding, activeCount: activeLoans.length, loans: loansWithProgress });
  } catch (err) { next(err); }
});

// GET /loans/:id
router.get('/:id', async (req, res, next) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, familyId: req.family._id });
    if (!loan) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Loan not found' } });
    return res.json({ loan: { ...loan.toObject(), progress: loanProgress(loan) } });
  } catch (err) { next(err); }
});

// PATCH /loans/:id
router.patch('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = loanSchema.partial().parse(req.body);
    if (data.startDate) data.startDate = new Date(data.startDate);
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, familyId: req.family._id },
      data, { new: true, runValidators: true }
    );
    if (!loan) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Loan not found' } });
    return res.json({ loan });
  } catch (err) { next(err); }
});

// DELETE /loans/:id
router.delete('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, familyId: req.family._id });
    if (!loan) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Loan not found' } });
    return res.json({ message: 'Loan deleted' });
  } catch (err) { next(err); }
});

// POST /loans/emi-calculator
router.post('/emi-calculator', authenticate, async (req, res, next) => {
  try {
    const { principal, annualRate, tenureMonths } = z.object({
      principal: z.number().positive(),
      annualRate: z.number().min(0),
      tenureMonths: z.number().int().positive(),
    }).parse(req.body);
    const result = calculateEmi(principal, annualRate, tenureMonths);
    return res.json({ result });
  } catch (err) { next(err); }
});

export default router;
