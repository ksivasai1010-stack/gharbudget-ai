import express from 'express';
import { z } from 'zod';
import Family from '../models/Family.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// We need two versions: one without family attachment (for creating initial family)
// and the rest with family context.

// POST /families — create a family (called during onboarding, no family yet)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const existing = await Membership.findOne({ userId: req.user._id, status: 'active' });
    if (existing) {
      return res.status(409).json({ error: { code: 'ALREADY_IN_FAMILY', message: 'You are already a member of a family' } });
    }
    const { name } = z.object({ name: z.string().min(2).max(100) }).parse(req.body);
    const family = await Family.create({ name, ownerId: req.user._id });
    await Membership.create({ familyId: family._id, userId: req.user._id, role: 'owner', status: 'active' });
    return res.status(201).json({ family });
  } catch (err) { next(err); }
});

// All routes below need family context
async function withFamily(req, res, next) {
  const membership = await Membership.findOne({ userId: req.user._id, status: 'active' }).populate('familyId');
  if (!membership) {
    return res.status(403).json({ error: { code: 'NO_FAMILY', message: 'User is not a member of any family' } });
  }
  req.family = membership.familyId;
  req.membership = membership;
  req.role = membership.role;
  next();
}

router.get('/current', authenticate, withFamily, async (req, res, next) => {
  try {
    const members = await Membership.find({ familyId: req.family._id, status: 'active' }).populate('userId', 'name email preferredLanguage');
    return res.json({ family: req.family, members });
  } catch (err) { next(err); }
});

router.patch('/current', authenticate, withFamily, async (req, res, next) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can edit family' } });
    const { name } = z.object({ name: z.string().min(2).max(100) }).parse(req.body);
    const family = await Family.findByIdAndUpdate(req.family._id, { name }, { new: true });
    return res.json({ family });
  } catch (err) { next(err); }
});

router.post('/current/members', authenticate, withFamily, async (req, res, next) => {
  try {
    if (!['owner', 'adult'].includes(req.role)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    const { email, role = 'adult' } = z.object({ email: z.string().email(), role: z.enum(['adult', 'viewer']).optional() }).parse(req.body);
    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'No user with that email' } });
    const existing = await Membership.findOne({ familyId: req.family._id, userId: invitee._id });
    if (existing) return res.status(409).json({ error: { code: 'ALREADY_MEMBER', message: 'User is already a member' } });
    const membership = await Membership.create({ familyId: req.family._id, userId: invitee._id, role, status: 'active', invitedBy: req.user._id });
    return res.status(201).json({ membership });
  } catch (err) { next(err); }
});

router.patch('/current/members/:id', authenticate, withFamily, async (req, res, next) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can change roles' } });
    const { role } = z.object({ role: z.enum(['adult', 'viewer']) }).parse(req.body);
    const membership = await Membership.findOneAndUpdate({ _id: req.params.id, familyId: req.family._id }, { role }, { new: true });
    if (!membership) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
    return res.json({ membership });
  } catch (err) { next(err); }
});

router.delete('/current/members/:id', authenticate, withFamily, async (req, res, next) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can remove members' } });
    const membership = await Membership.findOneAndUpdate({ _id: req.params.id, familyId: req.family._id }, { status: 'removed' }, { new: true });
    if (!membership) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
    return res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
});

export default router;
