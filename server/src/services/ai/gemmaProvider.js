import OpenAI from 'openai';
import { validateParsedExpense, buildExpenseParseSystemPrompt, buildCoachSystemPrompt } from './shared.js';
import { fallbackParseExpense, fallbackInsights } from './fallbackProvider.js';

function parseJsonSafe(text) {
  try {
    const cleaned = text.replace(/```json?\s*/gi, '').replace(/```\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export class GemmaProvider {
  constructor(config) {
    this.modelName = config.gemmaModel || 'gemma3:4b';
    this.timeoutMs = config.timeoutMs || 12000;
    this.client = new OpenAI({
      baseURL: config.gemmaBaseUrl || 'http://localhost:11434/v1',
      apiKey: config.gemmaApiKey || 'ollama',
      timeout: config.timeoutMs || 12000,
    });
  }

  get mode() { return 'live'; }

  async parseExpense(text, language = 'en', referenceDate = new Date()) {
    const today = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const systemPrompt = buildExpenseParseSystemPrompt(language);
    const userMessage = `Today's date: ${todayStr}\nUser text: ${text}\n\nOutput ONLY a valid JSON object.`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 200,
        });

        const responseText = completion.choices[0]?.message?.content || '';
        const parsed = parseJsonSafe(responseText);

        if (!parsed) {
          if (attempt === 2) return { ...fallbackParseExpense(text, referenceDate), mode: 'fallback' };
          continue;
        }

        const { data, error } = validateParsedExpense({
          ...parsed,
          amount: parsed.amount ? parsed.amount * 100 : null,
        });

        if (error) {
          if (attempt === 2) return { ...fallbackParseExpense(text, referenceDate), mode: 'fallback' };
          continue;
        }

        return { ...data, mode: 'live', confidence: parsed.confidence || 0.85 };
      } catch (err) {
        if (attempt === 2) {
          console.warn('Gemma parseExpense failed, using fallback:', err.message);
          return { ...fallbackParseExpense(text, referenceDate), mode: 'fallback' };
        }
      }
    }
  }

  async chat(messages, context, language = 'en') {
    const systemPrompt = buildCoachSystemPrompt(context, language);

    try {
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      ];

      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: chatMessages,
        temperature: 0.5,
        max_tokens: 400,
      });

      const text = completion.choices[0]?.message?.content || '';
      return { text, mode: 'live' };
    } catch (err) {
      console.warn('Gemma chat failed:', err.message);
      return { text: 'I\'m having trouble connecting right now. Please try again.', mode: 'fallback' };
    }
  }

  async generateInsights(context) {
    return fallbackInsights(context);
  }
}
