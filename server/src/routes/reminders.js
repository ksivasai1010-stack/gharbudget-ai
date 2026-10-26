import express from 'express';
import { z } from 'zod';
import BillReminder from '../models/BillReminder.js';
import Loan from '../models/Loan.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';
import { upcomingDues } from '../services/financeEngine.js';

const router = express.Router();
router.use(authenticate, attachFamily);

const reminderSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().int().min(0).optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  recurrence: z.enum(['none', 'monthly', 'yearly']).optional(),
  category: z.string().optional(),
  status: z.enum(['pending', 'paid']).optional(),
  linkedLoanId: z.string().optional(),
});

// GET /reminders
router.get('/', async (req, res, next) => {
  try {
    const reminders = await BillReminder.find({ familyId: req.family._id }).sort({ dueDate: 1 });
    return res.json({ reminders });
  } catch (err) { next(err); }
});

// GET /reminders/upcoming
router.get('/upcoming', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const [reminders, loans] = await Promise.all([
      BillReminder.find({ familyId: req.family._id, status: 'pending' }),
      Loan.find({ familyId: req.family._id, status: 'active' }),
    ]);
    const dues = upcomingDues(reminders, loans, days);
    return res.json({ upcoming: dues });
  } catch (err) { next(err); }
});

// POST /reminders
router.post('/', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = reminderSchema.parse(req.body);
    const reminder = await BillReminder.create({
      ...data,
      dueDate: new Date(data.dueDate),
      familyId: req.family._id,
      addedBy: req.user._id,
    });
    return res.status(201).json({ reminder });
  } catch (err) { next(err); }
});

// PATCH /reminders/:id
router.patch('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = reminderSchema.partial().parse(req.body);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    const reminder = await BillReminder.findOneAndUpdate(
      { _id: req.params.id, familyId: req.family._id },
      data, { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reminder not found' } });
    return res.json({ reminder });
  } catch (err) { next(err); }
});

// DELETE /reminders/:id
router.delete('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const reminder = await BillReminder.findOneAndDelete({ _id: req.params.id, familyId: req.family._id });
    if (!reminder) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reminder not found' } });
    return res.json({ message: 'Reminder deleted' });
  } catch (err) { next(err); }
});

export default router;
