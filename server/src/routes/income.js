import express from 'express';
import { z } from 'zod';
import IncomeRecord from '../models/IncomeRecord.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, attachFamily);

const incomeSchema = z.object({
  source: z.string().min(1).max(100),
  amount: z.number().int().positive(), // paise
  frequency: z.enum(['monthly', 'weekly', 'one-time']).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

// GET /income
router.get('/', async (req, res, next) => {
  try {
    const records = await IncomeRecord.find({ familyId: req.family._id }).sort({ createdAt: -1 });
    return res.json({ income: records });
  } catch (err) { next(err); }
});

// POST /income
router.post('/', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = incomeSchema.parse(req.body);
    const record = await IncomeRecord.create({ ...data, familyId: req.family._id, addedBy: req.user._id });
    return res.status(201).json({ income: record });
  } catch (err) { next(err); }
});

// PATCH /income/:id
router.patch('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = incomeSchema.partial().parse(req.body);
    const record = await IncomeRecord.findOneAndUpdate(
      { _id: req.params.id, familyId: req.family._id },
      data, { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Income record not found' } });
    return res.json({ income: record });
  } catch (err) { next(err); }
});

// DELETE /income/:id
router.delete('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const record = await IncomeRecord.findOneAndDelete({ _id: req.params.id, familyId: req.family._id });
    if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Income record not found' } });
    return res.json({ message: 'Income record deleted' });
  } catch (err) { next(err); }
});

export default router;
