import { config } from '../../config/index.js';
import { GeminiProvider } from './geminiProvider.js';
import { GemmaProvider } from './gemmaProvider.js';
import { fallbackParseExpense, fallbackCoachResponse, fallbackInsights } from './fallbackProvider.js';

// ── Provider singleton ────────────────────────────────────────────────────────
let _provider = null;

export function getAIProvider() {
  if (_provider) return _provider;

  const { ai } = config;

  if (ai.provider === 'gemini' && ai.geminiApiKey) {
    console.log(`[AI] Using Gemini provider (model: ${ai.geminiModel})`);
    _provider = new GeminiProvider(ai);
  } else if (ai.provider === 'gemma' && ai.gemmaBaseUrl) {
    console.log(`[AI] Using Gemma provider (model: ${ai.gemmaModel} at ${ai.gemmaBaseUrl})`);
    _provider = new GemmaProvider(ai);
  } else {
    console.log(`[AI] Using Fallback provider (no API key configured)`);
    _provider = createFallbackProvider();
  }

  return _provider;
}

function createFallbackProvider() {
  return {
    mode: 'fallback',
    parseExpense: (text, language, referenceDate) => Promise.resolve(fallbackParseExpense(text, referenceDate)),
    chat: (messages, context, language) => Promise.resolve(fallbackCoachResponse(
      messages[messages.length - 1]?.content || '', context, language
    )),
    generateInsights: (context) => Promise.resolve(fallbackInsights(context)),
  };
}

export function getAIStatus() {
  const { ai } = config;
  const provider = getAIProvider();

  if (ai.provider === 'gemini' && ai.geminiApiKey) {
    return { mode: 'live', provider: 'Gemini', model: ai.geminiModel };
  } else if (ai.provider === 'gemma' && ai.gemmaBaseUrl) {
    return { mode: 'live', provider: 'Gemma', model: ai.gemmaModel };
  }
  return { mode: 'fallback', provider: 'Rule-based', model: null };
}
