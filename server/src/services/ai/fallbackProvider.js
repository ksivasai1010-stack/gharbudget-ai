import { CATEGORIES } from '../../models/constants.js';

// ── Keyword dictionaries for fallback parsing ────────────────────────────────
const categoryKeywords = {
  Groceries: [
    'vegetable', 'vegetables', 'grocery', 'groceries', 'kirana', 'ration', 'sabzi', 'milk', 'doodh',
    'rice', 'dal', 'flour', 'atta', 'oil', 'masala', 'fruits', 'bread', 'eggs', 'నిత్యావసరాలు', 'రేషన్',
    'కూరగాయలు', 'పాలు', 'किराना', 'राशन', 'सब्जी', 'दूध', 'अनाज',
  ],
  Rent: ['rent', 'house rent', 'room rent', 'flat rent', 'అద్దె', 'किराया', 'మకాన్'],
  Utilities: [
    'electricity', 'electric', 'current bill', 'power bill', 'water bill', 'gas bill', 'internet',
    'wifi', 'broadband', 'phone bill', 'mobile bill', 'పవర్', 'కరెంట్', 'నీళ్ళు', 'बिजली', 'पानी', 'गैस',
  ],
  Education: [
    'school', 'fees', 'tuition', 'college', 'books', 'notebook', 'stationery', 'exam', 'uniform',
    'పాఠశాల', 'ఫీజు', 'పుస్తకాలు', 'स्कूल', 'फीस', 'किताबें', 'ट्यूशन',
  ],
  Transport: [
    'auto', 'auto fare', 'bus', 'train', 'petrol', 'diesel', 'cab', 'ola', 'uber', 'metro', 'rickshaw',
    'fuel', 'travel', 'ఆటో', 'పెట్రోల్', 'बस', 'ऑटो', 'पेट्रोल', 'यात्रा',
  ],
  'Loan EMI': ['emi', 'loan', 'installment', 'instalments', 'కిస్తీ', 'ఈఎంఐ', 'लोन', 'किस्त'],
  'Food & Dining': [
    'restaurant', 'hotel', 'food', 'zomato', 'swiggy', 'lunch', 'dinner', 'breakfast', 'tea',
    'coffee', 'chai', 'biryani', 'tiffin', 'భోజనం', 'హోటల్', 'खाना', 'होटल', 'चाय',
  ],
  Health: [
    'doctor', 'hospital', 'medicine', 'medical', 'pharmacy', 'chemist', 'clinic', 'tablets', 'pills',
    'test', 'scan', 'surgery', 'వైద్యం', 'మందులు', 'డాక్టర్', 'दवाई', 'डॉक्टर', 'अस्पताल',
  ],
  Festival: [
    'diwali', 'puja', 'festival', 'celebration', 'pooja', 'durga', 'eid', 'christmas', 'holi',
    'దీపావళి', 'పూజ', 'పండుగ', 'दिवाली', 'पूजा', 'त्योहार',
  ],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return cat;
    }
  }
  return 'Others';
}

// ── Amount regex ──────────────────────────────────────────────────────────────
// Matches: ₹250, Rs.250, Rs 250, rupees 250, రూ 250, रुपये 250, 250 rupees
const AMOUNT_RE = /(?:₹|rs\.?|rupees?|రూ\.?|రూపాయలు|रुपये?|रु\.?)\s*(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:rupees?|rs\.?|రూపాయలు|రూ|रुपये?|रु)/i;

function parseAmount(text) {
  const m = text.match(AMOUNT_RE);
  if (!m) return null;
  const raw = (m[1] || m[2]).replace(/,/g, '');
  const num = parseFloat(raw);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num); // integer rupees
}

// ── Date parsing ──────────────────────────────────────────────────────────────
function parseDate(text, referenceDate = new Date()) {
  const lower = text.toLowerCase();
  const ref = new Date(referenceDate);
  ref.setHours(12, 0, 0, 0);

  if (/\btoday\b|ఈ రోజు|आज\b/.test(lower)) return ref;

  if (/\byesterday\b|kal\b|నిన్న|kaal\b|कल\b/.test(lower)) {
    const d = new Date(ref);
    d.setDate(d.getDate() - 1);
    return d;
  }

  // ISO date or common patterns
  const dateMatch = text.match(/\b(\d{4}[-/]\d{2}[-/]\d{2})\b/);
  if (dateMatch) return new Date(dateMatch[1]);

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dmyMatch) return new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);

  return ref; // default to today
}

function formatDate(d) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ── Payment mode ──────────────────────────────────────────────────────────────
function parsePaymentMode(text) {
  const lower = text.toLowerCase();
  if (/\bupi\b|gpay|phonpe|paytm|bhim/.test(lower)) return 'upi';
  if (/\bcard\b|debit|credit|swipe/.test(lower)) return 'card';
  if (/\bcash\b|నగదు|नकद/.test(lower)) return 'cash';
  return 'cash';
}

// ── Main fallback parse ────────────────────────────────────────────────────────
export function fallbackParseExpense(text, referenceDate = new Date()) {
  const amount = parseAmount(text);
  const category = detectCategory(text);
  const date = parseDate(text, referenceDate);
  const paymentMode = parsePaymentMode(text);

  // Generate description from text (first ~50 chars, cleaned)
  const description = text
    .replace(AMOUNT_RE, '')
    .replace(/[₹रुपये रू రూ]/g, '')
    .trim()
    .slice(0, 80)
    || category;

  const needsAmount = !amount;
  const needsDate = false; // fallback always gives a date (defaults to today)

  return {
    amount: amount || null,
    description,
    category,
    date: formatDate(date),
    paymentMode,
    confidence: amount ? 0.6 : 0.2,
    needsAmount,
    needsDate,
    mode: 'fallback',
  };
}

// ── Fallback coach responses ──────────────────────────────────────────────────
export function fallbackCoachResponse(question, context, language = 'en') {
  const q = question.toLowerCase();
  const income = context.income / 100;
  const spent = context.spent / 100;
  const remaining = context.remaining / 100;

  const responses = {
    en: {
      topCategory: () => {
        const top = Object.entries(context.topCategories || {}).sort((a, b) => b[1] - a[1])[0];
        return top
          ? `Your highest spending this month is in **${top[0]}** at ₹${top[1] / 100}. Consider if you can reduce it.`
          : `Your spending breakdown is not available yet. Add your expenses to see insights.`;
      },
      remaining: () => `Your remaining budget this month is ₹${remaining}. You have earned ₹${income} and spent ₹${spent} so far.`,
      goalAfford: () => {
        const goals = context.goalsSummary || [];
        if (goals.length === 0) return `No savings goals set yet. Add a goal in the Savings Goals section!`;
        const totalRequired = goals.reduce((s, g) => s + (g.requiredMonthly || 0), 0) / 100;
        return `Your goals need ₹${totalRequired}/month total. After contributing, you would have ₹${remaining - totalRequired} left. ${remaining - totalRequired < 0 ? 'This may be tight — consider extending a deadline or reducing spending.' : 'This looks manageable!'}`;
      },
      emiExplain: () => `EMI (Equated Monthly Instalment) is a fixed amount you pay each month to repay a loan. It includes both principal and interest. Your current monthly EMI commitment is ₹${context.monthlyEmi / 100}.`,
      default: () => `Based on your recorded data: Income ₹${income}, Spent ₹${spent}, Remaining ₹${remaining}. For detailed advice, add more expenses and try again with a Gemini API key configured.`,
    },
  };

  const r = responses[language] || responses.en;

  if (/top|most|highest|where.*money|spending/.test(q)) return { text: r.topCategory(), mode: 'fallback' };
  if (/remaining|left|balance|how much/.test(q)) return { text: r.remaining(), mode: 'fallback' };
  if (/afford|goal|save|school|fees/.test(q)) return { text: r.goalAfford(), mode: 'fallback' };
  if (/emi|loan|installment|interest/.test(q)) return { text: r.emiExplain(), mode: 'fallback' };
  return { text: r.default(), mode: 'fallback' };
}

// ── Fallback insights ─────────────────────────────────────────────────────────
export function fallbackInsights(context) {
  const insights = [];
  const { topCategories, remaining, spent, income, budgetAlerts } = context;

  if (remaining < 0) {
    insights.push({ type: 'alert', text: `You have overspent by ₹${Math.abs(remaining) / 100} this month. Review your expenses urgently.` });
  } else if (remaining > 0 && income > 0) {
    const pct = Math.round((remaining / income) * 100);
    insights.push({ type: 'info', text: `You have ₹${remaining / 100} (${pct}% of income) remaining this month. Good job tracking!` });
  }

  if (topCategories) {
    const sorted = Object.entries(topCategories).sort((a, b) => b[1] - a[1]);
    if (sorted[0]) {
      insights.push({ type: 'info', text: `Your biggest spend is ${sorted[0][0]}: ₹${sorted[0][1] / 100} this month.` });
    }
  }

  const overspent = budgetAlerts?.filter(a => a.status === 'exceeded') || [];
  if (overspent.length > 0) {
    insights.push({ type: 'warning', text: `${overspent.map(a => a.category).join(', ')} ${overspent.length > 1 ? 'have' : 'has'} exceeded the budget limit.` });
  }

  return insights.slice(0, 4);
}
