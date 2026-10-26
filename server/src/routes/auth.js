import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Membership from '../models/Membership.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  preferredLanguage: z.enum(['en', 'te', 'hi']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: parsed.error.errors } });
    }

    const { name, email, password, preferredLanguage = 'en' } = parsed.data;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' } });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, preferredLanguage });

    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Also get family info
    const membership = await Membership.findOne({ userId: user._id, status: 'active' }).populate('familyId');

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage },
      family: membership?.familyId || null,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  return res.json({ message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const membership = await Membership.findOne({ userId: req.user._id, status: 'active' }).populate('familyId');
    return res.json({
      user: { id: req.user._id, name: req.user.name, email: req.user.email, preferredLanguage: req.user.preferredLanguage, isDemo: req.user.isDemo },
      family: membership?.familyId || null,
      role: membership?.role || null,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /auth/me - update profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const allowed = ['name', 'preferredLanguage'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    return res.json({ user: { id: user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage } });
  } catch (err) {
    next(err);
  }
});

export default router;
