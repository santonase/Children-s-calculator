// ===== Конфігурація гри: константи, рівні, ціни =====

const RANGE = 10; // числа від 1 до 10 для першого рівня
const STORAGE_KEY = 'kidsCalc.profiles';
const ACTIVE_KEY = 'kidsCalc.activeProfileId';

const AVATARS = ['🚀', '👩‍🚀', '👨‍🚀', '🐱', '🐶', '🦄', '🐻', '🦊'];

const OP_CONFIG = {
  add: { sign: '+', label: 'Додавання' },
  sub: { sign: '−', label: 'Віднімання' },
  mul: { sign: '×', label: 'Множення' },
  div: { sign: '÷', label: 'Ділення' },
};

// ----- Вікові рівні складності -----
const AGE_TIERS = {
  1: {
    name: 'Космонавт',
    ageHint: '5-6 років',
    icon: '🚀',
    ranges: {
      add: { maxSum: 10, maxTerm: 10, carry: false },
      sub: { maxTerm: 10 },
      mul: { maxFactor: 5 },
      div: { maxFactor: 5 },
    },
  },
  2: {
    name: 'Пілот',
    ageHint: '7-8 років',
    icon: '🛰️',
    ranges: {
      add: { maxSum: 20, maxTerm: 20, carry: true },
      sub: { maxTerm: 20 },
      mul: { maxFactor: 10 },
      div: { maxFactor: 10 },
    },
  },
  3: {
    name: 'Капітан',
    ageHint: '9-10 років',
    icon: '🪐',
    ranges: {
      add: { maxSum: 100, maxTerm: 100, carry: true },
      sub: { maxTerm: 100 },
      mul: { maxFactor: 10, maxProduct: 100 },
      div: { maxFactor: 10, maxProduct: 100 },
    },
  },
};

const TRACKS_PER_TIER = 10; // 10 доріжок = 100 завдань на тип

const LEVEL_META = {
  1: { icon: '🔢', name: 'Таблиця', hint: 'Прості приклади' },
  2: { icon: '❓', name: 'Пропущене число', hint: 'Знайди невідоме' },
  3: { icon: '📖', name: 'Задачі', hint: 'Космічні історії' },
};

const SKINS = [
  { id: 'rocket-classic', icon: '🚀', price: 0 },
  { id: 'rocket-ufo', icon: '🛸', price: 5 },
  { id: 'rocket-comet', icon: '☄️', price: 10 },
  { id: 'rocket-moon', icon: '🌕', price: 20 },
  { id: 'rocket-planet', icon: '🪐', price: 35 },
  { id: 'rocket-star', icon: '🌟', price: 55 },
  { id: 'rocket-galaxy', icon: '🌌', price: 80 },
];

const RANKS = [
  { min: 0, name: 'Новачок' },
  { min: 20, name: 'Космонавт' },
  { min: 50, name: 'Капітан' },
  { min: 100, name: 'Командир' },
  { min: 200, name: 'Командир флоту' },
];

const LEADERBOARD_KEY = 'kidsCalc.leaderboard';

const STREAK_BONUSES = { 3: 5, 7: 15, 30: 50 };

// ----- Життя -----
const MAX_LIVES = 5;
const LIFE_REGEN_MS = 30 * 60 * 1000; // 30 хвилин на 1 життя
const TASKS_PER_BLOCK = 10; // завдань у блоці
