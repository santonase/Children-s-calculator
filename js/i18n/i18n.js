// ===== Керування локалізацією =====
// Кожен мовний файл (uk.js, en.js) реєструє свій словник через registerLocale().
// Активний словник доступний глобально як T і WORD_TEMPLATES.

const LOCALES = {};
const LANG_KEY = 'kidsCalc.lang';

// Метадані доступних мов (для перемикача)
const LANGUAGES = [
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

// Активний словник та шаблони задач (встановлюються applyLocale)
let T = {};
let WORD_TEMPLATES = {};

function registerLocale(code, dict, templates) {
  LOCALES[code] = { dict, templates };
}

function getLang() {
  const saved = KVStore.getRaw(LANG_KEY);
  if (saved && LOCALES[saved]) return saved;
  // Автовизначення з мови браузера, інакше українська
  const nav = (navigator.language || 'uk').slice(0, 2).toLowerCase();
  return LOCALES[nav] ? nav : 'uk';
}

function setLang(code) {
  if (!LOCALES[code]) return;
  KVStore.setRaw(LANG_KEY, code);
  applyLocale(code);
}

function applyLocale(code) {
  const locale = LOCALES[code] || LOCALES['uk'];
  T = locale.dict;
  WORD_TEMPLATES = locale.templates;
}
