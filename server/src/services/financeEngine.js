/**
 * GharBudget AI — Deterministic Finance Engine
 * All amounts in integer paise (₹1 = 100 paise) unless noted.
 * Pure functions only — no DB calls, no side effects.
 */

import { CATEGORIES } from '../models/constants.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns "YYYY-MM" for a given Date.
 */
export function toYearMonth(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format paise as INR rupee string with Indian grouping.
 */
export function formatINR(paise) {
  const rupees = Math.round(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Integer ceiling division.
 */
function ceilDiv(a, b) {
  return Math.ceil(a / b);
}

// ─── Income ────────────────────────────────────────────────────────────────

/**
 * Calculate total monthly income from income records for a given month.
 * Monthly frequency records with no month field count every month.
 * Records with matching month field count for that month only.
 * Weekly: multiply weekly amount × ~4.33 (approximation, labeled as estimate).
 */
export function monthlyIncome(records, month) {
  if (!records || records.length === 0) return { total: 0, breakdown: [], isEstimate: false, assumptions: [] };

  let total = 0;
  const assumptions = [];
  let isEstimate = false;

  for (const r of records) {
    if (r.frequency === 'monthly') {
      if (!r.month || r.month === month) {
        total += r.amount;
      }
    } else if (r.frequency === 'weekly') {
      // 4.33 weeks per month on average
      const monthly = Math.round(r.amount * 4.33);
      if (!r.month || r.month === month) {
        total += monthly;
        isEstimate = true;
        assumptions.push(`${r.source}: weekly ₹${r.amount / 100} × 4.33 weeks = ₹${monthly / 100} (estimate)`);
      }
    } else if (r.frequency === 'one-time') {
      if (r.month === month) {
        total += r.amount;
      }
    }
  }

  return {
    total,
    isEstimate,
    assumptions,
  };
}

// ─── Expenses ──────────────────────────────────────────────────────────────

/**
 * Sum expenses for a given month.
 */
export function totalExpenses(expenses, month) {
  if (!expenses || expenses.length === 0) return 0;
  return expenses
    .filter(e => toYearMonth(e.date) === month)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Group expenses by category for a given month.
 * Returns: { [category]: totalPaise }
 */
export function expensesByCategory(expenses, month) {
  const result = {};
  for (const cat of CATEGORIES) result[cat] = 0;

  if (!expenses) return result;

  for (const e of expenses) {
    if (toYearMonth(e.date) === month) {
      result[e.category] = (result[e.category] || 0) + e.amount;
    }
  }
  return result;
}

/**
 * Remaining budget: income total − actual expenses total for the month.
 */
export function remainingBudget(incomeTotal, expensesTotal) {
  return incomeTotal - expensesTotal;
}

/**
 * Planned remaining: income total − total planned limits.
 */
export function plannedRemainingBudget(incomeTotal, totalPlanned) {
  return incomeTotal - totalPlanned;
}

// ─── Budget Utilization ─────────────────────────────────────────────────────

/**
 * Returns utilization for a single category.
 * status: 'ok' (<80%), 'warning' (80-99%), 'exceeded' (>=100%)
 */
export function budgetUtilization(spent, limit) {
  if (!limit || limit <= 0) {
    return { spent, limit: 0, utilization: null, status: 'no-limit' };
  }
  const utilization = spent / limit;
  let status;
  if (utilization >= 1) status = 'exceeded';
  else if (utilization >= 0.8) status = 'warning';
  else status = 'ok';

  return { spent, limit, utilization: Math.round(utilization * 10000) / 10000, status };
}

/**
 * Full budget summary for a month.
 */
export function budgetSummary(expenses, budget, month) {
  const byCat = expensesByCategory(expenses, month);
  const limitMap = {};
  const categoryLimits = budget?.categoryLimits || [];
  for (const cl of categoryLimits) {
    limitMap[cl.category] = cl.limit;
  }
  const totalPlanned = budget?.totalPlanned || categoryLimits.reduce((s, c) => s + c.limit, 0);

  const categories = CATEGORIES.map(cat => {
    const spent = byCat[cat] || 0;
    const limit = limitMap[cat] || 0;
    return {
      category: cat,
      spent,
      limit,
      remaining: Math.max(0, limit - spent),
      ...budgetUtilization(spent, limit),
    };
  });

  const overspentCategories = categories.filter(c => c.status === 'exceeded');
  const unallocated = Math.max(0, totalPlanned - categoryLimits.reduce((s, c) => s + c.limit, 0));

  return {
    categories,
    totalPlanned,
    overspentCategories,
    unallocated,
  };
}

// ─── Goals ──────────────────────────────────────────────────────────────────

/**
 * How many whole months remain until the deadline?
 * Returns at least 1.
 */
export function monthsRemaining(deadline, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const dl = new Date(deadline);
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth();
  const dlYear = dl.getFullYear();
  const dlMonth = dl.getMonth();

  const months = (dlYear - refYear) * 12 + (dlMonth - refMonth);
  if (months <= 0) return { months: 0, isPast: true };
  return { months, isPast: false };
}

/**
 * Required monthly contribution to reach a goal.
 */
export function requiredMonthlyContribution(targetAmount, savedAmount, deadline, referenceDate = new Date()) {
  const remaining = Math.max(0, targetAmount - savedAmount);
  if (remaining === 0) return { required: 0, months: 0, isPast: false, isEstimate: true, assumptions: [] };

  const { months, isPast } = monthsRemaining(deadline, referenceDate);
  if (isPast) {
    return {
      required: remaining,
      months: 0,
      isPast: true,
      isEstimate: true,
      assumptions: ['Deadline has already passed. Full remaining amount is due immediately.'],
    };
  }

  const required = ceilDiv(remaining, months);
  return {
    required, // integer paise
    months,
    isPast: false,
    isEstimate: true,
    assumptions: [
      `Target: ₹${targetAmount / 100}, Saved: ₹${savedAmount / 100}, Remaining: ₹${remaining / 100}`,
      `Months left: ${months}`,
      `Required per month: ₹${required / 100} (rounded up)`,
    ],
  };
}

/**
 * Goal affordability check.
 * Returns verdict and available amount after goal contribution.
 */
export function goalAffordability(remainingBudgetPaise, requiredContributionPaise) {
  const availableAfterGoal = remainingBudgetPaise - requiredContributionPaise;
  const affordable = availableAfterGoal >= 0;
  return {
    affordable,
    availableAfterGoal,
    shortfall: affordable ? 0 : Math.abs(availableAfterGoal),
    isEstimate: true,
    assumptions: [
      `Remaining budget: ₹${remainingBudgetPaise / 100}`,
      `Required goal contribution: ₹${requiredContributionPaise / 100}`,
      `After goal: ₹${availableAfterGoal / 100}`,
      affordable
        ? 'Goal is affordable at current recorded finances.'
        : `Unaffordable at current recorded finances. Shortfall: ₹${Math.abs(availableAfterGoal) / 100}.`,
    ],
  };
}

/**
 * Combined goal load across all active goals.
 */
export function combinedGoalAffordability(goals, remainingBudgetPaise, referenceDate = new Date()) {
  const contributions = goals.map(g => {
    const plan = requiredMonthlyContribution(g.targetAmount, g.savedAmount, g.deadline, referenceDate);
    return { name: g.name, required: plan.required, isPast: plan.isPast };
  });
  const totalRequired = contributions.reduce((s, c) => s + c.required, 0);
  const availableAfterAll = remainingBudgetPaise - totalRequired;

  return {
    contributions,
    totalRequired,
    availableAfterAll,
    affordable: availableAfterAll >= 0,
    shortfall: Math.max(0, -availableAfterAll),
    isEstimate: true,
    assumptions: [
      `Total required across ${goals.length} goals: ₹${totalRequired / 100}/month`,
      `Remaining budget: ₹${remainingBudgetPaise / 100}`,
      `After all goals: ₹${availableAfterAll / 100}`,
    ],
  };
}

// ─── Loans / EMI ────────────────────────────────────────────────────────────

/**
 * EMI calculation.
 * @param {number} principal - paise
 * @param {number} annualRate - annual interest rate in %
 * @param {number} tenureMonths - number of months
 * @returns {number} EMI in paise
 */
export function calculateEmi(principal, annualRate, tenureMonths) {
  if (!principal || !tenureMonths || tenureMonths <= 0 || principal <= 0) {
    return { emi: 0, totalPayable: 0, totalInterest: 0, isEstimate: true };
  }
  if (!annualRate || annualRate === 0) {
    const emi = Math.ceil(principal / tenureMonths);
    return {
      emi,
      totalPayable: emi * tenureMonths,
      totalInterest: 0,
      isEstimate: true,
      assumptions: ['Zero interest rate: simple division of principal'],
    };
  }
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  const factor = Math.pow(1 + r, n);
  const emi = Math.ceil((principal * r * factor) / (factor - 1));
  const totalPayable = emi * n;
  return {
    emi,
    totalPayable,
    totalInterest: totalPayable - principal,
    isEstimate: true,
    assumptions: [
      `Principal: ₹${principal / 100}, Rate: ${annualRate}%/year (${r.toFixed(4)}/month), Tenure: ${n} months`,
      'EMI = P × r × (1+r)^n / ((1+r)^n − 1)',
    ],
  };
}

/**
 * Loan progress — months remaining and % paid.
 * Returns null when not enough data.
 */
export function loanProgress(loan) {
  const { principal, outstandingBalance, startDate, tenureMonths } = loan;
  if (!principal || !startDate || !tenureMonths) {
    return { progress: null, reason: 'Not enough loan data to compute progress', isEstimate: true };
  }
  const paidAmount = principal - outstandingBalance;
  const percentPaid = Math.min(100, Math.round((paidAmount / principal) * 100));
  const monthsElapsed = Math.round(
    (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  const monthsLeft = Math.max(0, tenureMonths - monthsElapsed);
  return {
    paidAmount,
    percentPaid,
    monthsElapsed,
    monthsLeft,
    isEstimate: true,
    assumptions: ['Month elapsed uses 30.44-day average month', 'Remaining based on original tenure'],
  };
}

/**
 * Total monthly EMI commitment from active loans.
 */
export function monthlyLoanCommitments(loans) {
  if (!loans || loans.length === 0) return 0;
  return loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.emiAmount, 0);
}

// ─── Reminders & Due Dates ──────────────────────────────────────────────────

/**
 * Clamp day-of-month to valid day for given month/year.
 */
function clampDay(year, month, day) {
  const maxDay = new Date(year, month + 1, 0).getDate(); // last day of month
  return Math.min(day, maxDay);
}

/**
 * Get upcoming due dates for reminders and loan EMIs within N days.
 * Returns sorted array with { title, amount, dueDate, daysUntilDue, type, category }.
 */
export function upcomingDues(reminders, loans, days = 30, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  const cutoff = new Date(ref);
  cutoff.setDate(cutoff.getDate() + days);

  const dues = [];

  // Bill reminders
  for (const r of reminders || []) {
    if (r.status === 'paid') continue;
    const due = new Date(r.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due >= ref && due <= cutoff) {
      const daysUntilDue = Math.round((due - ref) / (1000 * 60 * 60 * 24));
      dues.push({
        id: r._id?.toString() || r.id,
        title: r.title,
        amount: r.amount || 0,
        dueDate: due,
        daysUntilDue,
        type: 'reminder',
        category: r.category || 'Others',
      });
    }
  }

  // Loan EMIs
  for (const l of loans || []) {
    if (l.status !== 'active') continue;
    // Compute next EMI date this month or next
    const now = new Date(referenceDate);
    let emiYear = now.getFullYear();
    let emiMonth = now.getMonth();
    let emiDay = clampDay(emiYear, emiMonth, l.emiDayOfMonth);
    let emiDate = new Date(emiYear, emiMonth, emiDay);
    emiDate.setHours(0, 0, 0, 0);

    // If this month's EMI already passed, go to next month
    if (emiDate < ref) {
      emiMonth++;
      if (emiMonth > 11) { emiMonth = 0; emiYear++; }
      emiDay = clampDay(emiYear, emiMonth, l.emiDayOfMonth);
      emiDate = new Date(emiYear, emiMonth, emiDay);
      emiDate.setHours(0, 0, 0, 0);
    }

    if (emiDate <= cutoff) {
      const daysUntilDue = Math.round((emiDate - ref) / (1000 * 60 * 60 * 24));
      dues.push({
        id: l._id?.toString() || l.id,
        title: `${l.lender} EMI`,
        amount: l.emiAmount,
        dueDate: emiDate,
        daysUntilDue,
        type: 'loan-emi',
        category: 'Loan EMI',
      });
    }
  }

  return dues.sort((a, b) => a.dueDate - b.dueDate);
}

// ─── Spending Trend ─────────────────────────────────────────────────────────

/**
 * Month-over-month spending trend for the last N months (default 6).
 * Returns array of { month, total, byCategory, changes (% vs previous month) }
 */
export function spendingTrend(expenses, numMonths = 6, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const months = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    months.push(toYearMonth(d));
  }

  const data = months.map(m => ({
    month: m,
    total: totalExpenses(expenses, m),
    byCategory: expensesByCategory(expenses, m),
  }));

  // Compute month-over-month % changes
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].total;
    const curr = data[i].total;
    data[i].change = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

    const catChanges = {};
    for (const cat of CATEGORIES) {
      const pv = data[i - 1].byCategory[cat] || 0;
      const cv = data[i].byCategory[cat] || 0;
      catChanges[cat] = pv > 0 ? Math.round(((cv - pv) / pv) * 100) : null;
    }
    data[i].categoryChanges = catChanges;
  }

  return data;
}

// ─── Dashboard Aggregate ────────────────────────────────────────────────────

/**
 * Compute the full dashboard summary.
 * All results derived from provided data — no DB access.
 */
export function dashboardSummary({
  incomeRecords,
  expenses,
  budget,
  goals,
  loans,
  reminders,
  month,
  referenceDate = new Date(),
}) {
  const incomeResult = monthlyIncome(incomeRecords, month);
  const income = incomeResult.total;
  const spent = totalExpenses(expenses, month);
  const remaining = remainingBudget(income, spent);

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalGoalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const savingsPercent = totalGoalTarget > 0 ? Math.round((totalSaved / totalGoalTarget) * 100) : 0;

  const trend = spendingTrend(expenses, 6, referenceDate);

  const goalsWithPlans = goals.map(g => ({
    ...g.toObject ? g.toObject() : g,
    plan: requiredMonthlyContribution(g.targetAmount, g.savedAmount, g.deadline, referenceDate),
  }));

  const upcoming = upcomingDues(reminders, loans, 30, referenceDate);

  const budgetSum = budgetSummary(expenses, budget, month);

  const combined = combinedGoalAffordability(goals, remaining, referenceDate);

  return {
    month,
    income,
    incomeIsEstimate: incomeResult.isEstimate,
    spent,
    remaining,
    totalSaved,
    totalGoalTarget,
    savingsPercent,
    trend,
    goals: goalsWithPlans,
    upcoming,
    budget: budgetSum,
    combinedGoals: combined,
    monthlyEmiCommitment: monthlyLoanCommitments(loans),
  };
}
