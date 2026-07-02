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
  order: { sign: '', label: 'Порядок дій' },
  frac: { sign: '', label: 'Частини числа' },
};

// ----- Класи НУШ -----
// Кожен клас містить лише ті розділи, що передбачені шкільною програмою.
// ranges задають діапазони чисел для генератора під цей клас.
const GRADES = {
  1: {
    name: '1 клас',
    icon: '1️⃣',
    hint: 'Числа до 20',
    sections: ['add', 'sub'],
    ranges: {
      add: { maxSum: 20, maxTerm: 20, carry: true },
      sub: { maxTerm: 20 },
    },
  },
  2: {
    name: '2 клас',
    icon: '2️⃣',
    hint: 'Числа до 100, таблиця множення',
    sections: ['add', 'sub', 'mul', 'div'],
    ranges: {
      add: { maxSum: 100, maxTerm: 100, carry: true },
      sub: { maxTerm: 100 },
      mul: { maxFactor: 9 },
      div: { maxFactor: 9 },
    },
  },
  3: {
    name: '3 клас',
    icon: '3️⃣',
    hint: 'Числа до 1000, порядок дій',
    sections: ['add', 'sub', 'mul', 'div', 'order'],
    ranges: {
      add: { maxSum: 1000, maxTerm: 1000, carry: true },
      sub: { maxTerm: 1000 },
      mul: { maxFactor: 10, maxProduct: 100, extra: true }, // + позатабличне (24×3)
      div: { maxFactor: 10, maxProduct: 100, extra: true },
      order: { maxTerm: 20 }, // вирази у 2 дії з дужками
    },
  },
  4: {
    name: '4 клас',
    icon: '4️⃣',
    hint: 'Великі числа, частини',
    sections: ['add', 'sub', 'mul', 'div', 'order', 'frac'],
    ranges: {
      add: { maxSum: 10000, maxTerm: 10000, carry: true },
      sub: { maxTerm: 10000 },
      mul: { maxFactor: 100, maxProduct: 1000, extra: true },
      div: { maxFactor: 100, maxProduct: 1000, extra: true },
      order: { maxTerm: 100 },
      frac: { maxNumber: 100 }, // знайти половину/третину/чверть
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
  { min: 0, key: 'novice' },
  { min: 20, key: 'cosmonaut' },
  { min: 50, key: 'captain' },
  { min: 100, key: 'commander' },
  { min: 200, key: 'fleet' },
];

const LEADERBOARD_KEY = 'kidsCalc.leaderboard';

const STREAK_BONUSES = { 3: 5, 7: 15, 30: 50 };

// ----- Життя -----
const MAX_LIVES = 5;
const LIFE_REGEN_MS = 30 * 60 * 1000; // 30 хвилин на 1 життя
const TASKS_PER_BLOCK = 10; // завдань у блоці
