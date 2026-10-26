/**
 * Format paise as INR currency string with Indian number grouping.
 * @param {number} paise - amount in paise (integer)
 * @param {object} options - Intl.NumberFormat options
 */
export function formatINR(paise, options = {}) {
  const rupees = Math.round(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(rupees);
}

/**
 * Convert rupees (number) to paise (integer).
 */
export function toPaise(rupees) {
  return Math.round(parseFloat(rupees) * 100);
}

/**
 * Convert paise to rupees (number).
 */
export function toRupees(paise) {
  return Math.round(paise) / 100;
}

/**
 * Get "YYYY-MM" for a Date.
 */
export function toYearMonth(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format a date for display. 
 */
export function formatDate(date, locale = 'en-IN') {
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a date as YYYY-MM-DD for input[type=date].
 */
export function toInputDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get time-of-day greeting.
 */
export function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/**
 * Get color class for budget utilization status.
 */
export function getStatusColor(status) {
  switch (status) {
    case 'exceeded': return 'text-red-600';
    case 'warning': return 'text-amber-dark';
    case 'ok': return 'text-emerald-DEFAULT';
    default: return 'text-gray-400';
  }
}

export function getStatusBgColor(status) {
  switch (status) {
    case 'exceeded': return 'bg-red-500';
    case 'warning': return 'bg-amber-DEFAULT';
    case 'ok': return 'bg-emerald-DEFAULT';
    default: return 'bg-gray-300';
  }
}

/**
 * Category icons mapping using Lucide icon names.
 */
export const CATEGORY_ICONS = {
  Groceries: 'ShoppingBasket',
  Rent: 'Home',
  Utilities: 'Zap',
  Education: 'GraduationCap',
  Transport: 'Car',
  'Loan EMI': 'CreditCard',
  'Food & Dining': 'UtensilsCrossed',
  Health: 'Heart',
  Festival: 'Star',
  Others: 'MoreHorizontal',
};

export const CATEGORY_COLORS = {
  Groceries: '#0F9D74',
  Rent: '#3B82F6',
  Utilities: '#F59E0B',
  Education: '#8B5CF6',
  Transport: '#06B6D4',
  'Loan EMI': '#EF4444',
  'Food & Dining': '#F97316',
  Health: '#EC4899',
  Festival: '#84CC16',
  Others: '#94A3B8',
};

/**
 * Truncate text to max length with ellipsis.
 */
export function truncate(text, maxLen = 40) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

/**
 * Check if a value is a valid number (not NaN, not Infinity).
 */
export function isValidNumber(val) {
  const n = Number(val);
  return !isNaN(n) && isFinite(n) && n > 0;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Format a month string "YYYY-MM" as "October 2024".
 */
export function formatMonthLabel(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export const CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Education', 'Transport',
  'Loan EMI', 'Food & Dining', 'Health', 'Festival', 'Others'
];
