import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';

export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiry });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function authenticate(req, res, next) {
  try {
    // Support both cookie and Authorization header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}

export async function attachFamily(req, res, next) {
  try {
    const membership = await Membership.findOne({
      userId: req.user._id,
      status: 'active',
    }).populate('familyId');

    if (!membership) {
      return res.status(403).json({ error: { code: 'NO_FAMILY', message: 'User is not a member of any family' } });
    }

    req.family = membership.familyId;
    req.membership = membership;
    req.role = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: `This action requires one of these roles: ${roles.join(', ')}` },
      });
    }
    next();
  };
}
