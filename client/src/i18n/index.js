import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en.js';
import { te } from './locales/te.js';
import { hi } from './locales/hi.js';

// Flatten nested translation objects for i18next
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, fullKey));
    } else {
      acc[fullKey] = val;
    }
    return acc;
  }, {});
}

const savedLang = localStorage.getItem('gharbudget-lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: flatten(en) },
      te: { translation: { ...flatten(en), ...flatten(te) } }, // fallback to en for missing keys
      hi: { translation: { ...flatten(en), ...flatten(hi) } },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem('gharbudget-lang', lang);
  document.documentElement.lang = lang;
}

export default i18n;
