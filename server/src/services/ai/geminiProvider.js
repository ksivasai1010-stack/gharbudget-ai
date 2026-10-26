import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateParsedExpense, buildExpenseParseSystemPrompt, buildCoachSystemPrompt } from './shared.js';
import { fallbackParseExpense, fallbackInsights } from './fallbackProvider.js';

function parseJsonSafe(text) {
  try {
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json?\s*/gi, '').replace(/```\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export class GeminiProvider {
  constructor(config) {
    this.apiKey = config.geminiApiKey;
    this.modelName = config.geminiModel || 'gemini-2.0-flash';
    this.timeoutMs = config.timeoutMs || 12000;
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  get mode() { return 'live'; }

  async _callWithTimeout(fn) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), this.timeoutMs)
      ),
    ]);
  }

  async parseExpense(text, language = 'en', referenceDate = new Date()) {
    const today = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const systemPrompt = buildExpenseParseSystemPrompt(language);
    const userMessage = `Today's date: ${todayStr}\nUser text: ${text}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = this.client.getGenerativeModel({
          model: this.modelName,
          systemInstruction: systemPrompt,
        });
        const result = await this._callWithTimeout(() =>
          model.generateContent(userMessage)
        );
        const responseText = result.response.text();
        const parsed = parseJsonSafe(responseText);

        if (!parsed) {
          if (attempt === 2) return { ...fallbackParseExpense(text, referenceDate), mode: 'fallback' };
          continue;
        }

        const { data, error } = validateParsedExpense({
          ...parsed,
          amount: parsed.amount ? parsed.amount * 100 : null, // convert rupees to paise
        });

        if (error) {
          if (attempt === 2) return { ...fallbackParseExpense(text, referenceDate), mode: 'fallback' };
          continue;
        }

        return { ...data, mode: 'live', confidence: parsed.confidence || 0.9 };
      } catch (err) {
        if (attempt === 2) {
          console.warn('Gemini parseExpense failed, using fallback:', err.message);
          return { ...fallbackParseExpense(text, referenceDate), mode: 'fallback' };
        }
      }
    }
  }

  async chat(messages, context, language = 'en') {
    const systemPrompt = buildCoachSystemPrompt(context, language);

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
      });

      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1];

      const result = await this._callWithTimeout(() =>
        chat.sendMessage(lastMessage.content)
      );
      const text = result.response.text();
      return { text, mode: 'live' };
    } catch (err) {
      console.warn('Gemini chat failed:', err.message);
      return { text: 'I\'m having trouble connecting right now. Please try again in a moment.', mode: 'fallback' };
    }
  }

  async generateInsights(context, language = 'en') {
    const prompt = `You are a financial advisor for an Indian family. Based on this month's data, provide 2-4 SHORT, actionable insights (max 20 words each) in ${language}.
Data: Income ₹${context.income / 100}, Spent ₹${context.spent / 100}, Remaining ₹${context.remaining / 100}
Top categories: ${JSON.stringify(context.topCategories)}
Overspent: ${JSON.stringify(context.budgetAlerts?.filter(a => a.status === 'exceeded')?.map(a => a.category))}

Output ONLY a JSON array: [{"type":"info|warning|alert", "text":"insight text"}]`;

    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      const result = await this._callWithTimeout(() => model.generateContent(prompt));
      const text = result.response.text();
      const parsed = parseJsonSafe(text);
      if (Array.isArray(parsed)) return parsed.slice(0, 4);
    } catch (err) {
      console.warn('Gemini insights failed:', err.message);
    }
    return fallbackInsights(context);
  }
}
