import express from 'express';
import { z } from 'zod';
import Expense from '../models/Expense.js';
import { CATEGORIES } from '../models/constants.js';
import { authenticate, attachFamily, requireRole } from '../middleware/auth.js';
import { getAIProvider } from '../services/ai/index.js';

const router = express.Router();
router.use(authenticate, attachFamily);

const expenseSchema = z.object({
  amount: z.number().int().positive(), // paise
  description: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  paymentMode: z.enum(['cash', 'upi', 'card', 'other']).optional(),
  visibility: z.enum(['family', 'private']).optional(),
  source: z.enum(['manual', 'ai-parsed', 'voice']).optional(),
});

// GET /expenses
router.get('/', async (req, res, next) => {
  try {
    const { from, to, category, q, sort = '-date', page = 1, limit = 50 } = req.query;
    const query = { familyId: req.family._id };

    // Viewers and other adults can only see family-visible or own private expenses
    if (req.role !== 'owner') {
      query.$or = [{ visibility: 'family' }, { addedBy: req.user._id, visibility: 'private' }];
    }

    if (from) query.date = { ...query.date, $gte: new Date(from) };
    if (to) query.date = { ...query.date, $lte: new Date(to) };
    if (category && CATEGORIES.includes(category)) query.category = category;
    if (q) query.description = { $regex: q, $options: 'i' };

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('addedBy', 'name');

    return res.json({
      expenses,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
});

// POST /expenses
router.post('/', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await Expense.create({
      ...data,
      date: new Date(data.date),
      familyId: req.family._id,
      addedBy: req.user._id,
    });
    return res.status(201).json({ expense });
  } catch (err) { next(err); }
});

// POST /expenses/parse — AI parsing (does NOT save)
router.post('/parse', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const { text } = z.object({ text: z.string().min(1).max(500) }).parse(req.body);
    const language = req.user.preferredLanguage || 'en';
    const provider = getAIProvider();
    const result = await provider.parseExpense(text, language, new Date());
    return res.json({ parsed: result });
  } catch (err) { next(err); }
});

// GET /expenses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const query = { _id: req.params.id, familyId: req.family._id };
    if (req.role !== 'owner') {
      query.$or = [{ visibility: 'family' }, { addedBy: req.user._id }];
    }
    const expense = await Expense.findOne(query).populate('addedBy', 'name');
    if (!expense) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } });
    return res.json({ expense });
  } catch (err) { next(err); }
});

// PATCH /expenses/:id
router.patch('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const data = expenseSchema.partial().parse(req.body);
    if (data.date) data.date = new Date(data.date);

    // Only owner can edit others' expenses
    const query = { _id: req.params.id, familyId: req.family._id };
    if (req.role !== 'owner') query.addedBy = req.user._id;

    const expense = await Expense.findOneAndUpdate(query, data, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expense not found or not authorized' } });
    return res.json({ expense });
  } catch (err) { next(err); }
});

// DELETE /expenses/:id
router.delete('/:id', requireRole('owner', 'adult'), async (req, res, next) => {
  try {
    const query = { _id: req.params.id, familyId: req.family._id };
    if (req.role !== 'owner') query.addedBy = req.user._id;

    const expense = await Expense.findOneAndDelete(query);
    if (!expense) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expense not found or not authorized' } });
    return res.json({ message: 'Expense deleted' });
  } catch (err) { next(err); }
});

export default router;
