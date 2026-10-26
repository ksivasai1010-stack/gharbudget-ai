import express from 'express';

const router = express.Router();

// Static lesson content - organized by language
const lessons = {
  en: [
    {
      id: 'budgeting-101',
      title: 'Budgeting Basics for Indian Families',
      category: 'Budgeting',
      readTime: '4 min',
      summary: 'Learn how to plan your monthly budget effectively.',
      sections: [
        { heading: 'What is a Budget?', content: 'A budget is a plan for how you will spend your money each month. Think of it like planning your grocery list — you decide what to buy before going to the shop, so you don\'t spend more than you have.' },
        { heading: 'Why Budget?', content: 'Without a budget, money disappears without a plan. With a budget, you know exactly where every rupee goes — rent, groceries, school fees, EMIs, and savings.' },
        { heading: 'How to Start', content: '1. Write down all income sources.\n2. List all regular expenses (rent, bills, EMIs).\n3. Set a limit for variable expenses (groceries, transport).\n4. Save first, then spend the rest.' },
        { heading: 'Indian Household Tip', content: 'Many families use the envelope method: put cash in separate envelopes labeled for each category. When the envelope is empty, no more spending in that category for the month.' },
      ],
      quiz: {
        question: 'What is the first step to creating a budget?',
        options: ['Spend first, track later', 'Write down all income and expenses', 'Take a loan', 'Ask your neighbor'],
        correctIndex: 1,
      },
    },
    {
      id: 'emergency-fund',
      title: 'Why Every Family Needs an Emergency Fund',
      category: 'Savings',
      readTime: '3 min',
      summary: 'Understand why an emergency fund is your financial safety net.',
      sections: [
        { heading: 'What is an Emergency Fund?', content: 'An emergency fund is money set aside for unexpected expenses — medical emergencies, job loss, urgent repairs, or family crises. It is not for planned expenses.' },
        { heading: 'How Much to Save?', content: 'A common guideline is 3-6 months of essential expenses (rent, food, utilities, EMIs). For example, if your essential monthly expenses are ₹15,000, aim to save ₹45,000 to ₹90,000. This is a general guideline, not a guarantee.' },
        { heading: 'Where to Keep It', content: 'Keep your emergency fund in an easily accessible account (like a savings account). Don\'t invest it in stocks or long-term deposits where you can\'t access it quickly.' },
        { heading: 'Build It Slowly', content: 'Start small. Even ₹500 per month adds up. Once you save ₹5,000, you\'re protected against small emergencies. Keep building from there.' },
      ],
      quiz: {
        question: 'Where should you keep your emergency fund?',
        options: ['In stocks', 'In a fixed deposit that can\'t be broken', 'In an easily accessible savings account', 'Under your mattress'],
        correctIndex: 2,
      },
    },
    {
      id: 'loans-emis',
      title: 'Understanding Loans and EMIs',
      category: 'Loans',
      readTime: '5 min',
      summary: 'Know what you\'re signing up for before taking a loan.',
      sections: [
        { heading: 'What is an EMI?', content: 'EMI stands for Equated Monthly Instalment. It is a fixed amount you pay every month to repay a loan. Each EMI includes two parts: principal (the loan amount) and interest (the bank\'s charge for lending).' },
        { heading: 'How Interest Works', content: 'If you borrow ₹1,00,000 at 12% per year for 12 months, your EMI is about ₹8,885/month. You pay ₹1,06,620 total — ₹6,620 is the interest. The bank earns this for giving you the money upfront.' },
        { heading: 'Before Taking a Loan', content: '• Can you afford the EMI without straining your budget?\n• Is the interest rate reasonable?\n• What happens if you miss a payment?\n• Is there a better option (savings, family help)?' },
        { heading: 'Responsible Borrowing', content: 'Borrow only what you need. Repay on time to protect your credit and avoid penalties. Never take a loan to repay another loan without understanding the terms.' },
      ],
      quiz: {
        question: 'What does EMI stand for?',
        options: ['Extra Money Income', 'Equated Monthly Instalment', 'Easy Money Interest', 'Expected Monthly Investment'],
        correctIndex: 1,
      },
    },
    {
      id: 'savings-habits',
      title: 'Building Good Savings Habits',
      category: 'Savings',
      readTime: '3 min',
      summary: 'Simple habits that help Indian families save more every month.',
      sections: [
        { heading: 'Pay Yourself First', content: 'When your salary comes in, transfer your savings amount immediately — before paying any bills. Even ₹500 counts. Treat savings like a non-negotiable bill.' },
        { heading: 'Track Every Rupee', content: 'Write down all spending for one month. Most families discover they spend ₹1,000-3,000 on unplanned items (chai, snacks, small online orders). Awareness is the first step to change.' },
        { heading: 'Festival and Season Planning', content: 'Diwali, Eid, Ugadi, school admissions, weddings — these come every year. Create a separate savings goal for each. Even ₹200/month for Diwali adds up to ₹2,400 by October.' },
        { heading: 'Avoid "Buy Now, Worry Later"', content: 'Easy credit (credit cards, app loans) makes it tempting to buy now. But every debt reduces your future freedom. Ask: "Can I save for this first?"' },
      ],
      quiz: {
        question: 'What does "Pay Yourself First" mean?',
        options: ['Spend on yourself before bills', 'Save money before spending', 'Get paid first in family', 'Buy what you want first'],
        correctIndex: 1,
      },
    },
    {
      id: 'inflation',
      title: 'What is Inflation and Why it Matters',
      category: 'Budgeting',
      readTime: '4 min',
      summary: 'Why ₹1,000 today buys less than it did 5 years ago.',
      sections: [
        { heading: 'What is Inflation?', content: 'Inflation means prices go up over time. If groceries cost ₹5,000/month today, in 5 years they might cost ₹6,500 for the same items. Your money\'s purchasing power falls.' },
        { heading: 'Real-Life Impact', content: 'School fees, vegetable prices, petrol, medicines — all tend to increase every year. If your income doesn\'t grow but prices do, your standard of living falls.' },
        { heading: 'What Can You Do?', content: '• Increase income where possible\n• Reduce wasteful spending\n• Build savings that grow (though we cannot predict returns)\n• Plan for higher future costs in your savings goals' },
        { heading: 'A Note on Returns', content: 'Different savings and investment options carry different risks and potential returns. We recommend consulting a registered financial advisor for investment decisions.' },
      ],
      quiz: {
        question: 'What does inflation cause?',
        options: ['Prices to fall', 'Money to buy more', 'Prices to rise over time', 'Income to increase automatically'],
        correctIndex: 2,
      },
    },
    {
      id: 'fraud-awareness',
      title: 'Financial Fraud Awareness — Stay Safe',
      category: 'Fraud awareness',
      readTime: '5 min',
      summary: 'Protect yourself from UPI fraud, KYC scams, and phishing.',
      sections: [
        { heading: 'Common Scams in India', content: 'Fraudsters trick people into sharing UPI PINs, OTPs, and bank details using fake calls, messages, and links. Once you share these, money is stolen instantly.' },
        { heading: 'NEVER Share These', content: '🚫 UPI PIN or MPIN\n🚫 OTP (One-Time Password)\n🚫 Bank account password\n🚫 Card CVV number\n🚫 Aadhaar OTP\n\nNo legitimate bank, NPCI, or government official will EVER ask for these.' },
        { heading: 'Common Scam Methods', content: '• Fake KYC update calls: "Your account will be blocked"\n• Prize/lottery calls: "You won ₹10 lakhs"\n• Fake job offers requiring advance payment\n• Fake loan agents asking for processing fees upfront\n• Screen sharing apps: Never give remote access to your phone' },
        { heading: 'If You Are Targeted', content: '1. Hang up or delete the message immediately.\n2. Never click links from unknown senders.\n3. Report to your bank and Cyber Crime helpline: 1930.\n4. File a complaint at cybercrime.gov.in' },
      ],
      quiz: {
        question: 'What should you NEVER share with anyone, including bank employees?',
        options: ['Your name', 'Your OTP or UPI PIN', 'Your bank branch', 'Your account type'],
        correctIndex: 1,
      },
    },
    {
      id: 'compound-interest',
      title: 'Interest and Compound Interest Explained',
      category: 'Savings',
      readTime: '4 min',
      summary: 'Understand how interest works for and against you.',
      sections: [
        { heading: 'Simple Interest', content: 'Simple interest is calculated only on the original amount. If you deposit ₹10,000 at 5% per year, you earn ₹500 each year. After 3 years: ₹11,500 total.' },
        { heading: 'Compound Interest', content: 'With compound interest, interest is added to your balance and earns interest too. ₹10,000 at 5% compounded yearly: Year 1 → ₹10,500, Year 2 → ₹11,025, Year 3 → ₹11,576. You earn ₹76 more than simple interest.' },
        { heading: 'Compound Interest Against You', content: 'Loans and credit cards use compound interest too — but working against you. A ₹50,000 credit card debt at 3% per month compounds quickly. Pay off debts quickly to avoid this.' },
        { heading: 'Key Takeaway', content: 'Start saving early, even small amounts. Time is a powerful multiplier for compounding. Conversely, clear debts quickly to avoid the same power working against you.' },
      ],
      quiz: {
        question: 'In compound interest, interest is calculated on:',
        options: ['Original amount only', 'Original amount plus accumulated interest', 'Just the interest', 'Your total income'],
        correctIndex: 1,
      },
    },
  ],
};

// Telugu content (simplified)
lessons.te = lessons.en.map(l => ({ ...l, _language: 'te' }));
// Hindi content (simplified)  
lessons.hi = lessons.en.map(l => ({ ...l, _language: 'hi' }));

// GET /lessons
router.get('/', (req, res) => {
  const lang = req.query.lang || 'en';
  const category = req.query.category;
  const content = lessons[lang] || lessons.en;
  const filtered = category && category !== 'All'
    ? content.filter(l => l.category === category)
    : content;
  return res.json({ lessons: filtered });
});

// GET /lessons/:id
router.get('/:id', (req, res) => {
  const lang = req.query.lang || 'en';
  const content = lessons[lang] || lessons.en;
  const lesson = content.find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found' } });
  return res.json({ lesson });
});

export default router;
