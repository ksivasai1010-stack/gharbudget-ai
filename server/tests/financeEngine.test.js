import { describe, it, expect } from 'vitest';
import {
  monthlyIncome,
  totalExpenses,
  expensesByCategory,
  remainingBudget,
  budgetUtilization,
  requiredMonthlyContribution,
  goalAffordability,
  combinedGoalAffordability,
  calculateEmi,
  loanProgress,
  monthlyLoanCommitments,
  upcomingDues,
  spendingTrend,
  toYearMonth,
  formatINR,
} from '../src/services/financeEngine.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const P = (rupees) => rupees * 100; // rupees → paise

describe('toYearMonth', () => {
  it('formats date correctly', () => {
    expect(toYearMonth(new Date('2024-03-15'))).toBe('2024-03');
  });
  it('handles month 1 (January)', () => {
    expect(toYearMonth(new Date('2024-01-01'))).toBe('2024-01');
  });
});

describe('formatINR', () => {
  it('formats paise as INR', () => {
    expect(formatINR(P(35000))).toContain('35,000');
    expect(formatINR(P(120000))).toContain('1,20,000');
  });
  it('handles zero', () => {
    expect(formatINR(0)).toContain('0');
  });
});

// ── Income ─────────────────────────────────────────────────────────────────

describe('monthlyIncome', () => {
  it('sums monthly recurring records', () => {
    const records = [
      { source: 'Salary', amount: P(30000), frequency: 'monthly' },
      { source: 'Rent Income', amount: P(5000), frequency: 'monthly' },
    ];
    expect(monthlyIncome(records, '2024-03').total).toBe(P(35000));
  });

  it('returns 0 for empty records', () => {
    expect(monthlyIncome([], '2024-03').total).toBe(0);
    expect(monthlyIncome(null, '2024-03').total).toBe(0);
  });

  it('includes one-time income for matching month', () => {
    const records = [
      { source: 'Bonus', amount: P(10000), frequency: 'one-time', month: '2024-03' },
      { source: 'Bonus', amount: P(10000), frequency: 'one-time', month: '2024-04' },
    ];
    expect(monthlyIncome(records, '2024-03').total).toBe(P(10000));
    expect(monthlyIncome(records, '2024-05').total).toBe(0);
  });

  it('applies weekly conversion (isEstimate=true)', () => {
    const records = [
      { source: 'Daily wages', amount: P(5000), frequency: 'weekly' },
    ];
    const result = monthlyIncome(records, '2024-03');
    expect(result.total).toBe(Math.round(P(5000) * 4.33));
    expect(result.isEstimate).toBe(true);
  });
});

// ── Expenses ───────────────────────────────────────────────────────────────

const makeExpense = (rupees, category, dateStr) => ({
  amount: P(rupees), category, date: new Date(dateStr),
});

describe('totalExpenses', () => {
  it('sums expenses for the given month', () => {
    const expenses = [
      makeExpense(1000, 'Groceries', '2024-03-10'),
      makeExpense(2000, 'Rent', '2024-03-01'),
      makeExpense(500, 'Groceries', '2024-04-01'), // different month
    ];
    expect(totalExpenses(expenses, '2024-03')).toBe(P(3000));
  });

  it('returns 0 for empty', () => {
    expect(totalExpenses([], '2024-03')).toBe(0);
    expect(totalExpenses(null, '2024-03')).toBe(0);
  });
});

describe('expensesByCategory', () => {
  it('groups by category correctly', () => {
    const expenses = [
      makeExpense(500, 'Groceries', '2024-03-01'),
      makeExpense(300, 'Groceries', '2024-03-05'),
      makeExpense(8000, 'Rent', '2024-03-01'),
      makeExpense(200, 'Transport', '2024-04-01'), // wrong month
    ];
    const result = expensesByCategory(expenses, '2024-03');
    expect(result['Groceries']).toBe(P(800));
    expect(result['Rent']).toBe(P(8000));
    expect(result['Transport']).toBe(0);
  });
});

describe('remainingBudget', () => {
  it('computes correctly', () => {
    expect(remainingBudget(P(35000), P(32500))).toBe(P(2500));
  });
  it('handles overspent (negative)', () => {
    expect(remainingBudget(P(10000), P(12000))).toBe(P(-2000));
  });
  it('zero income', () => {
    expect(remainingBudget(0, P(5000))).toBe(P(-5000));
  });
});

// ── Budget Utilization ──────────────────────────────────────────────────────

describe('budgetUtilization', () => {
  it('ok status when <80%', () => {
    const r = budgetUtilization(P(600), P(1000));
    expect(r.status).toBe('ok');
    expect(r.utilization).toBeCloseTo(0.6, 2);
  });
  it('warning at 80-99%', () => {
    const r = budgetUtilization(P(850), P(1000));
    expect(r.status).toBe('warning');
  });
  it('exceeded at 100%+', () => {
    const r = budgetUtilization(P(1200), P(1000));
    expect(r.status).toBe('exceeded');
  });
  it('no-limit when limit=0', () => {
    expect(budgetUtilization(P(500), 0).status).toBe('no-limit');
  });
  it('handles zero spent', () => {
    expect(budgetUtilization(0, P(1000)).status).toBe('ok');
  });
});

// ── Goals ───────────────────────────────────────────────────────────────────

describe('requiredMonthlyContribution', () => {
  const ref = new Date('2024-10-01');

  it('school fees ₹12,000 in 6 months = ₹2,000/month', () => {
    const deadline = new Date('2025-04-01');
    const result = requiredMonthlyContribution(P(12000), 0, deadline, ref);
    expect(result.required).toBe(P(2000));
    expect(result.months).toBe(6);
    expect(result.isPast).toBe(false);
  });

  it('handles partially saved', () => {
    const deadline = new Date('2025-04-01');
    const result = requiredMonthlyContribution(P(12000), P(6000), deadline, ref);
    expect(result.required).toBe(P(1000)); // 6000 / 6
  });

  it('returns 0 when already saved', () => {
    const deadline = new Date('2025-04-01');
    const result = requiredMonthlyContribution(P(5000), P(5000), deadline, ref);
    expect(result.required).toBe(0);
  });

  it('flags past deadline', () => {
    const pastDeadline = new Date('2023-01-01');
    const result = requiredMonthlyContribution(P(10000), 0, pastDeadline, ref);
    expect(result.isPast).toBe(true);
    expect(result.required).toBe(P(10000));
  });

  it('rounds up (ceiling not floor)', () => {
    // 10001 paise / 3 months = 3334 (not 3333)
    const deadline = new Date('2025-01-01');
    const ref2 = new Date('2024-10-01');
    const result = requiredMonthlyContribution(P(100) + 1, 0, deadline, ref2);
    // 10001 paise / 3 months = ceil = 3334
    expect(result.required).toBe(3334);
  });
});

describe('goalAffordability', () => {
  it('affordable when remaining > required', () => {
    const r = goalAffordability(P(2500), P(2000));
    expect(r.affordable).toBe(true);
    expect(r.availableAfterGoal).toBe(P(500));
    expect(r.shortfall).toBe(0);
  });

  it('unaffordable when remaining < required', () => {
    const r = goalAffordability(P(1500), P(2000));
    expect(r.affordable).toBe(false);
    expect(r.shortfall).toBe(P(500));
  });

  it('exactly affordable (0 left)', () => {
    const r = goalAffordability(P(2000), P(2000));
    expect(r.affordable).toBe(true);
    expect(r.availableAfterGoal).toBe(0);
  });
});

// ── EMI ─────────────────────────────────────────────────────────────────────

describe('calculateEmi', () => {
  it('computes EMI correctly for standard home loan', () => {
    // ₹20L, 8.5% p.a., 240 months → EMI ~₹17,356
    const result = calculateEmi(P(2000000), 8.5, 240);
    // Rough check: EMI should be between ₹17,000 and ₹18,000
    expect(result.emi).toBeGreaterThan(P(17000));
    expect(result.emi).toBeLessThan(P(18000));
  });

  it('handles zero interest rate', () => {
    const result = calculateEmi(P(12000), 0, 6);
    expect(result.emi).toBe(P(2000)); // 12000 / 6
    expect(result.totalInterest).toBe(0);
  });

  it('handles zero principal', () => {
    const result = calculateEmi(0, 8.5, 12);
    expect(result.emi).toBe(0);
  });

  it('handles zero tenure', () => {
    const result = calculateEmi(P(100000), 8.5, 0);
    expect(result.emi).toBe(0);
  });
});

// ── Loan Progress ────────────────────────────────────────────────────────────

describe('loanProgress', () => {
  it('returns null reason when missing data', () => {
    const result = loanProgress({ principal: P(100000) });
    expect(result.progress).toBeNull();
  });

  it('computes percent paid', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const result = loanProgress({
      principal: P(100000),
      outstandingBalance: P(70000),
      startDate,
      tenureMonths: 24,
    });
    expect(result.percentPaid).toBe(30);
  });
});

// ── Monthly Loan Commitments ──────────────────────────────────────────────────

describe('monthlyLoanCommitments', () => {
  it('sums active EMIs only', () => {
    const loans = [
      { status: 'active', emiAmount: P(5000) },
      { status: 'active', emiAmount: P(3000) },
      { status: 'completed', emiAmount: P(10000) },
    ];
    expect(monthlyLoanCommitments(loans)).toBe(P(8000));
  });

  it('returns 0 for no loans', () => {
    expect(monthlyLoanCommitments([])).toBe(0);
    expect(monthlyLoanCommitments(null)).toBe(0);
  });
});

// ── Upcoming Dues ─────────────────────────────────────────────────────────────

describe('upcomingDues', () => {
  const ref = new Date('2024-10-01');

  it('includes reminder due within window', () => {
    const reminders = [{
      _id: 'r1', title: 'Electricity Bill', amount: P(1200),
      dueDate: new Date('2024-10-10'), status: 'pending', category: 'Utilities',
    }];
    const dues = upcomingDues(reminders, [], 30, ref);
    expect(dues).toHaveLength(1);
    expect(dues[0].title).toBe('Electricity Bill');
    expect(dues[0].daysUntilDue).toBe(9);
  });

  it('excludes paid reminders', () => {
    const reminders = [{
      _id: 'r1', title: 'Paid Bill', amount: P(500),
      dueDate: new Date('2024-10-10'), status: 'paid', category: 'Utilities',
    }];
    const dues = upcomingDues(reminders, [], 30, ref);
    expect(dues).toHaveLength(0);
  });

  it('handles EMI day 31 in a 30-day month', () => {
    // October has 31 days, November has 30
    const ref2 = new Date('2024-11-01');
    const loans = [{
      _id: 'l1', lender: 'Bank', emiDayOfMonth: 31,
      emiAmount: P(5000), status: 'active',
    }];
    const dues = upcomingDues([], loans, 31, ref2);
    // Day 31 in November clamped to 30
    expect(dues[0].dueDate.getDate()).toBe(30);
  });

  it('returns sorted by due date', () => {
    const ref2 = new Date('2024-10-01');
    const reminders = [
      { _id: 'r1', title: 'Late Bill', amount: P(500), dueDate: new Date('2024-10-20'), status: 'pending', category: 'Others' },
      { _id: 'r2', title: 'Early Bill', amount: P(200), dueDate: new Date('2024-10-05'), status: 'pending', category: 'Others' },
    ];
    const dues = upcomingDues(reminders, [], 30, ref2);
    expect(dues[0].title).toBe('Early Bill');
    expect(dues[1].title).toBe('Late Bill');
  });
});

// ── Spending Trend ────────────────────────────────────────────────────────────

describe('spendingTrend', () => {
  const ref = new Date('2024-03-01');
  const expenses = [
    makeExpense(10000, 'Groceries', '2024-01-15'),
    makeExpense(12000, 'Groceries', '2024-02-15'),
    makeExpense(15000, 'Groceries', '2024-03-15'),
  ];

  it('returns data for 6 months', () => {
    const trend = spendingTrend(expenses, 6, ref);
    expect(trend).toHaveLength(6);
  });

  it('computes month-over-month change', () => {
    const trend = spendingTrend(expenses, 3, ref);
    const jan = trend[0];
    const feb = trend[1];
    const mar = trend[2];
    expect(jan.total).toBe(P(10000));
    expect(feb.total).toBe(P(12000));
    expect(feb.change).toBe(20); // +20%
    expect(mar.change).toBe(25); // +25%
  });
});
