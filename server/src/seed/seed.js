import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Membership from '../models/Membership.js';
import IncomeRecord from '../models/IncomeRecord.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Loan from '../models/Loan.js';
import BillReminder from '../models/BillReminder.js';

const DEMO_EMAIL = 'demo@gharbudget.ai';
const DEMO_PASSWORD = 'DemoPass@123';
const P = (rupees) => rupees * 100; // Convert to paise

function getMonthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDate(daysFromNow = 0, monthOffset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function firstOfMonth(monthOffset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(1);
  return d;
}

async function clearDemoData() {
  const user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) return;
  const membership = await Membership.findOne({ userId: user._id, status: 'active' });
  if (membership) {
    const familyId = membership.familyId;
    await Promise.all([
      Expense.deleteMany({ familyId }),
      IncomeRecord.deleteMany({ familyId }),
      Budget.deleteMany({ familyId }),
      SavingsGoal.deleteMany({ familyId }),
      Loan.deleteMany({ familyId }),
      BillReminder.deleteMany({ familyId }),
      Membership.deleteMany({ familyId }),
      Family.findByIdAndDelete(familyId),
    ]);
  }
  await User.findByIdAndDelete(user._id);
  console.log('Demo data cleared.');
}

async function seed() {
  const isReset = process.argv.includes('--reset');
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Check if demo user exists
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing && !isReset) {
    console.log('Demo data already exists. Use --reset to recreate.');
    await mongoose.disconnect();
    return;
  }

  if (isReset || existing) {
    await clearDemoData();
  }

  // ── Create demo user ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.create({
    name: 'Sharma Family',
    email: DEMO_EMAIL,
    passwordHash,
    preferredLanguage: 'en',
    isDemo: true,
  });
  console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // ── Create family ─────────────────────────────────────────────────────────
  const family = await Family.create({
    name: 'Sharma Family',
    ownerId: user._id,
    currency: 'INR',
    isDemo: true,
  });

  await Membership.create({
    familyId: family._id,
    userId: user._id,
    role: 'owner',
    status: 'active',
  });
  console.log('Created Sharma Family');

  const familyId = family._id;
  const addedBy = user._id;
  const currentMonth = getMonthStr(0);

  // ── Income ────────────────────────────────────────────────────────────────
  await IncomeRecord.create({
    familyId, source: 'Salary — Rajan Sharma', amount: P(35000),
    frequency: 'monthly', addedBy,
  });
  console.log('Created income records');

  // ── Current month expenses ───────────────────────────────────────────────
  // Rent: ₹8,000
  await Expense.create({ familyId, addedBy, amount: P(8000), description: 'Monthly rent — Sector 12 flat', category: 'Rent', date: firstOfMonth(0), paymentMode: 'upi', visibility: 'family', source: 'manual' });

  // Groceries: ₹7,000 split
  await Expense.create({ familyId, addedBy, amount: P(2500), description: 'Vegetables and fruits — weekly market', category: 'Groceries', date: getDate(3, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(1800), description: 'Kirana items — rice, dal, oil, masala', category: 'Groceries', date: getDate(5, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(1500), description: 'Milk and dairy — monthly', category: 'Groceries', date: getDate(1, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(1200), description: 'Snacks, biscuits, bread', category: 'Groceries', date: getDate(7, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });

  // Utilities: ₹2,500 split
  await Expense.create({ familyId, addedBy, amount: P(1200), description: 'Electricity bill — October', category: 'Utilities', date: getDate(8, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(799), description: 'Internet bill — Jio Fiber', category: 'Utilities', date: getDate(2, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(501), description: 'LPG gas cylinder', category: 'Utilities', date: getDate(10, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });

  // Education: ₹3,000 split
  await Expense.create({ familyId, addedBy, amount: P(2000), description: 'Priya school monthly fees', category: 'Education', date: getDate(1, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(600), description: 'School notebooks and stationery', category: 'Education', date: getDate(4, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(400), description: 'Extra tuition classes', category: 'Education', date: getDate(9, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });

  // Transport: ₹3,000 split
  await Expense.create({ familyId, addedBy, amount: P(1200), description: 'Auto fare — office commute', category: 'Transport', date: getDate(6, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(1000), description: 'Petrol — two-wheeler', category: 'Transport', date: getDate(3, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(800), description: 'Bus passes — weekly', category: 'Transport', date: getDate(2, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });

  // Loan EMI: ₹5,000
  await Expense.create({ familyId, addedBy, amount: P(5000), description: 'Home loan EMI — SBI', category: 'Loan EMI', date: getDate(5, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });

  // Others: ₹4,000 split
  await Expense.create({ familyId, addedBy, amount: P(1200), description: 'Medical — pharmacy tablets', category: 'Health', date: getDate(7, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(1000), description: 'Restaurant dinner — family outing', category: 'Food & Dining', date: getDate(8, 0), paymentMode: 'upi', visibility: 'family', source: 'manual' });
  await Expense.create({ familyId, addedBy, amount: P(1800), description: 'Miscellaneous purchases', category: 'Others', date: getDate(10, 0), paymentMode: 'cash', visibility: 'family', source: 'manual' });

  console.log('Created current month expenses (₹32,500 total)');

  // ── Historical expenses for trend chart (5 prior months) ──────────────────
  const historicalData = [
    { offset: -5, rent: 8000, groceries: 6500, utilities: 2200, education: 2500, transport: 2800, emi: 5000, others: 3800 },
    { offset: -4, rent: 8000, groceries: 6800, utilities: 2400, education: 2800, transport: 2900, emi: 5000, others: 3500 },
    { offset: -3, rent: 8000, groceries: 7200, utilities: 2300, education: 3000, transport: 3100, emi: 5000, others: 4200 },
    { offset: -2, rent: 8000, groceries: 6900, utilities: 2600, education: 2800, transport: 2700, emi: 5000, others: 3600 },
    { offset: -1, rent: 8000, groceries: 7100, utilities: 2400, education: 3000, transport: 3000, emi: 5000, others: 4100 },
  ];

  for (const hd of historicalData) {
    const entries = [
      { amount: P(hd.rent), description: 'Monthly rent', category: 'Rent', date: firstOfMonth(hd.offset) },
      { amount: P(hd.groceries), description: 'Groceries — monthly', category: 'Groceries', date: getDate(5, hd.offset) },
      { amount: P(hd.utilities), description: 'Utility bills', category: 'Utilities', date: getDate(8, hd.offset) },
      { amount: P(hd.education), description: 'School fees and materials', category: 'Education', date: getDate(1, hd.offset) },
      { amount: P(hd.transport), description: 'Transport expenses', category: 'Transport', date: getDate(3, hd.offset) },
      { amount: P(hd.emi), description: 'Home loan EMI', category: 'Loan EMI', date: getDate(5, hd.offset) },
      { amount: P(hd.others), description: 'Other expenses', category: 'Others', date: getDate(10, hd.offset) },
    ];
    await Promise.all(entries.map(e => Expense.create({ ...e, familyId, addedBy, paymentMode: 'cash', visibility: 'family', source: 'manual' })));
  }
  console.log('Created 5 months of historical data');

  // ── Budget ────────────────────────────────────────────────────────────────
  await Budget.create({
    familyId,
    month: currentMonth,
    totalPlanned: P(34000),
    categoryLimits: [
      { category: 'Groceries', limit: P(7500) },
      { category: 'Rent', limit: P(8000) },
      { category: 'Utilities', limit: P(3000) },
      { category: 'Education', limit: P(3500) },
      { category: 'Transport', limit: P(3500) },
      { category: 'Loan EMI', limit: P(5000) },
      { category: 'Food & Dining', limit: P(1500) },
      { category: 'Health', limit: P(1500) },
      { category: 'Others', limit: P(2000) },
    ],
  });
  console.log('Created budget');

  // ── Savings Goals ─────────────────────────────────────────────────────────
  // School Fees: ₹12,000 target, ₹0 saved, due in 6 months
  await SavingsGoal.create({
    familyId, addedBy,
    name: "Priya's School Annual Fees",
    type: 'school_fees',
    targetAmount: P(12000),
    savedAmount: 0,
    deadline: getDate(0, 6),
    priority: 'high',
    visibility: 'family',
    contributions: [],
  });

  // Emergency Fund: ₹50,000 target, ₹18,000 saved
  await SavingsGoal.create({
    familyId, addedBy,
    name: 'Emergency Fund',
    type: 'emergency',
    targetAmount: P(50000),
    savedAmount: P(18000),
    deadline: getDate(0, 18),
    priority: 'high',
    visibility: 'family',
    contributions: [
      { amount: P(5000), date: getDate(0, -5), by: addedBy },
      { amount: P(5000), date: getDate(0, -3), by: addedBy },
      { amount: P(8000), date: getDate(0, -1), by: addedBy },
    ],
  });

  // Diwali Fund: ₹10,000 target, ₹3,500 saved
  await SavingsGoal.create({
    familyId, addedBy,
    name: 'Diwali Celebration Fund',
    type: 'festival',
    targetAmount: P(10000),
    savedAmount: P(3500),
    deadline: getDate(0, 3),
    priority: 'medium',
    visibility: 'family',
    contributions: [
      { amount: P(1500), date: getDate(0, -2), by: addedBy },
      { amount: P(2000), date: getDate(0, -1), by: addedBy },
    ],
  });
  console.log('Created savings goals');

  // ── Loan ─────────────────────────────────────────────────────────────────
  const loan = await Loan.create({
    familyId, addedBy,
    lender: 'SBI Home Loans',
    type: 'home',
    principal: P(2000000), // ₹20,00,000
    outstandingBalance: P(1650000), // ₹16,50,000
    interestRate: 8.5,
    emiAmount: P(5000),
    emiDayOfMonth: 5, // Due on 5th of every month (within ~10 days from start of month demo)
    startDate: new Date('2022-04-05'),
    tenureMonths: 240,
    status: 'active',
  });
  console.log('Created loan');

  // ── Bill Reminders ───────────────────────────────────────────────────────
  await BillReminder.create({
    familyId, addedBy,
    title: 'Electricity Bill — October',
    amount: P(1200),
    dueDate: getDate(7, 0), // Due in 7 days
    recurrence: 'monthly',
    category: 'Utilities',
    status: 'pending',
  });

  await BillReminder.create({
    familyId, addedBy,
    title: "Priya's School Fee Reminder",
    amount: P(2000),
    dueDate: getDate(12, 0),
    recurrence: 'monthly',
    category: 'Education',
    status: 'pending',
  });

  await BillReminder.create({
    familyId, addedBy,
    title: 'SBI Home Loan EMI',
    amount: P(5000),
    dueDate: getDate(5, 0),
    recurrence: 'monthly',
    category: 'Loan EMI',
    status: 'pending',
    linkedLoanId: loan._id,
  });
  console.log('Created reminders');

  console.log('\n✅ Demo seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Demo Login: ${DEMO_EMAIL}`);
  console.log(`Password:   ${DEMO_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
