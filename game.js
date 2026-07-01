// ===== Дитячий калькулятор — логіка гри =====

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

// Відмінювання іменників за числівником: 1 / 2-4 / 5-10
function threeWay(n, one, few, many) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

// Дієслово/непрямий відмінок: 1 / 2 і більше (для непрямих відмінків форма 2-4 і 5+ однакова)
function twoWay(n, singular, plural) {
  return n === 1 ? singular : plural;
}

const WORD_TEMPLATES = {
  add: [
    (a, b) => `У капітана ${twoWay(a, 'була', 'було')} ${a} ${threeWay(a, 'зірка', 'зірки', 'зірок')}, він знайшов ще ${b}. Скільки зірок у нього тепер?`,
    (a, b) => `На кораблі ${twoWay(a, 'летів', 'летіло')} ${a} ${threeWay(a, 'астронавт', 'астронавти', 'астронавтів')}, приєдналося ще ${b}. Скільки астронавтів разом?`,
    (a, b) => `Робот зібрав ${a} ${threeWay(a, 'метеорит', 'метеорити', 'метеоритів')} вранці і ${b} ввечері. Скільки метеоритів усього?`,
    (a, b) => `На станції ${twoWay(a, 'був', 'було')} ${a} ${threeWay(a, 'супутник', 'супутники', 'супутників')}, запустили ще ${b}. Скільки супутників стало?`,
    (a, b) => `Інопланетянин мав ${a} ${threeWay(a, 'кристал', 'кристали', 'кристалів')}, знайшов ще ${b}. Скільки кристалів тепер?`,
    (a, b) => `Екіпаж побачив ${a} ${threeWay(a, 'комета', 'комети', 'комет')}, потім ще ${b}. Скільки комет побачили всього?`,
    (a, b) => `У ракети ${twoWay(a, 'був', 'було')} ${a} ${threeWay(a, 'бак', 'баки', 'баків')} з паливом, додали ще ${b}. Скільки баків стало?`,
    (a, b) => `На планеті ${twoWay(a, 'жив', 'жило')} ${a} ${threeWay(a, 'робот', 'роботи', 'роботів')}, прилетіло ще ${b}. Скільки роботів тепер?`,
    (a, b) => `Астронавт зробив ${a} фото зірок і ще ${b} фото планет. Скільки фото всього?`,
    (a, b) => `У космічному саду ${twoWay(a, 'росла', 'росло')} ${a} ${threeWay(a, 'рослина', 'рослини', 'рослин')}, посадили ще ${b}. Скільки рослин стало?`,
  ],
  sub: [
    (a, b) => `У ракети ${twoWay(a, 'був', 'було')} ${a} ${threeWay(a, 'бак', 'баки', 'баків')} палива, витрачено ${b} ${threeWay(b, 'бак', 'баки', 'баків')}. Скільки баків лишилось?`,
    (a, b) => `Капітан мав ${a} ${threeWay(a, 'зірка', 'зірки', 'зірок')} на карті, ${b} ${twoWay(b, 'зникла', 'зникли')}. Скільки зірок лишилось?`,
    (a, b) => `На станції ${twoWay(a, 'був', 'було')} ${a} ${threeWay(a, 'космонавт', 'космонавти', 'космонавтів')}, ${b} ${twoWay(b, 'полетів', 'полетіли')} додому. Скільки лишилось?`,
    (a, b) => `Робот зібрав ${a} ${threeWay(a, 'камінь', 'камені', 'каменів')}, ${b} загубив. Скільки каменів лишилось?`,
    (a, b) => `У кораблі було ${a} ${threeWay(a, 'відро', 'відра', 'відер')} з водою, ${b} використали. Скільки відер лишилось?`,
    (a, b) => `Інопланетянин мав ${a} ${threeWay(a, 'монета', 'монети', 'монет')}, витратив ${b}. Скільки монет лишилось?`,
    (a, b) => `На небі ${twoWay(a, 'була', 'було')} ${a} ${threeWay(a, 'видима зірка', 'видимі зірки', 'видимих зірок')}, ${b} ${twoWay(b, 'сховалася', 'сховались')} за хмари. Скільки видно тепер?`,
    (a, b) => `У бортовому журналі ${twoWay(a, 'був', 'було')} ${a} ${threeWay(a, 'запис', 'записи', 'записів')}, ${b} стерли. Скільки записів лишилось?`,
    (a, b) => `Екіпаж мав ${a} ${threeWay(a, 'скафандр', 'скафандри', 'скафандрів')}, ${b} ${twoWay(b, 'пошкодився', 'пошкодились')}. Скільки цілих лишилось?`,
    (a, b) => `На орбіті ${twoWay(a, 'був', 'було')} ${a} ${threeWay(a, 'супутник', 'супутники', 'супутників')}, ${b} ${twoWay(b, 'згорів', 'згоріли')}. Скільки супутників лишилось?`,
  ],
  mul: [
    (a, b) => `На кожній з ${a} ${twoWay(a, 'планети', 'планет')} ${twoWay(b, 'живе', 'живуть')} ${b} ${threeWay(b, 'інопланетянин', 'інопланетяни', 'інопланетян')}. Скільки всього інопланетян?`,
    (a, b) => `У ${a} ${twoWay(a, 'ракеті', 'ракетах')} по ${b} ${threeWay(b, 'космонавту', 'космонавти', 'космонавтів')}. Скільки космонавтів усього?`,
    (a, b) => `Робот розклав ${a} ${threeWay(a, 'ряд', 'ряди', 'рядів')} по ${b} ${threeWay(b, 'зірці', 'зірки', 'зірок')} в кожному. Скільки зірок усього?`,
    (a, b) => `На ${a} ${twoWay(a, 'кораблі', 'кораблях')} по ${b} ${threeWay(b, 'відсіку', 'відсіки', 'відсіків')}. Скільки відсіків усього?`,
    (a, b) => `У ${a} ${twoWay(a, 'скафандрі', 'скафандрах')} по ${b} ${threeWay(b, 'кишені', 'кишені', 'кишень')}. Скільки кишень усього?`,
    (a, b) => `На кожній з ${a} ${twoWay(a, 'станції', 'станцій')} ${twoWay(b, 'живе', 'живуть')} ${b} ${threeWay(b, 'робот', 'роботи', 'роботів')}. Скільки роботів усього?`,
    (a, b) => `У ${a} ${twoWay(a, 'ящику', 'ящиках')} по ${b} ${threeWay(b, 'метеориту', 'метеорити', 'метеоритів')}. Скільки метеоритів усього?`,
    (a, b) => `На ${a} ${twoWay(a, 'орбіті', 'орбітах')} по ${b} ${threeWay(b, 'супутнику', 'супутники', 'супутників')}. Скільки супутників усього?`,
    (a, b) => `У ${a} ${twoWay(a, 'галактиці', 'галактиках')} по ${b} ${threeWay(b, 'новій зірці', 'нові зірки', 'нових зірок')}. Скільки зірок усього?`,
    (a, b) => `На ${a} ${twoWay(a, 'планеті', 'планетах')} по ${b} ${threeWay(b, 'озеру', 'озера', 'озер')}. Скільки озер усього?`,
  ],
  div: [
    (a, b) => `${a} ${threeWay(a, 'метеорит', 'метеорити', 'метеоритів')} розділили рівно між ${b} ${twoWay(b, 'космонавтом', 'космонавтами')}. Скільки отримав кожен?`,
    (a, b) => `${a} ${threeWay(a, 'зірку', 'зірки', 'зірок')} розкидали рівно по ${b} ${twoWay(b, 'сузір’ю', 'сузір’ях')}. Скільки зірок у кожному?`,
    (a, b) => `${a} ${threeWay(a, 'космонавта', 'космонавти', 'космонавтів')} розсадили рівно у ${b} ${twoWay(b, 'ракету', 'ракети')}. Скільки в кожній ракеті?`,
    (a, b) => `${a} ${threeWay(a, 'кристал', 'кристали', 'кристалів')} поділили рівно між ${b} ${twoWay(b, 'інопланетянином', 'інопланетянами')}. Скільки отримав кожен?`,
    (a, b) => `${a} ${threeWay(a, 'робота', 'роботи', 'роботів')} розподілили рівно по ${b} ${twoWay(b, 'станції', 'станціях')}. Скільки роботів на станції?`,
    (a, b) => `${a} ${threeWay(a, 'банку', 'банки', 'банок')} з паливом розділили рівно на ${b} ${twoWay(b, 'корабель', 'кораблі')}. Скільки банок на корабель?`,
    (a, b) => `${a} ${threeWay(a, 'фотографію', 'фотографії', 'фотографій')} розклали рівно у ${b} ${twoWay(b, 'альбом', 'альбоми')}. Скільки фото в альбомі?`,
    (a, b) => `${a} ${threeWay(a, 'скафандр', 'скафандри', 'скафандрів')} розділили рівно між ${b} ${twoWay(b, 'екіпажем', 'екіпажами')}. Скільки скафандрів на екіпаж?`,
    (a, b) => `${a} ${threeWay(a, 'монету', 'монети', 'монет')} розділили рівно між ${b} ${twoWay(b, 'планетою', 'планетами')}. Скільки монет на планету?`,
    (a, b) => `${a} ${threeWay(a, 'камінь', 'камені', 'каменів')} розклали рівно у ${b} ${twoWay(b, 'мішок', 'мішки')}. Скільки каменів у мішку?`,
  ],
};

let state = {
  op: 'add',
  tier: 1,           // віковий рівень (1=Космонавт, 2=Пілот, 3=Капітан)
  level: 1,          // тип завдання (1=Таблиця, 2=Пропущене, 3=Задачі)
  track: 1,          // номер доріжки (1..10, далі нескінченно)
  taskNum: 1,        // поточне завдання в доріжці (1..10)
  correctCount: 0,   // скільки завдань доріжки пройдено правильно
  blockMistakes: 0,  // помилок за поточну доріжку (для бонусу за ідеальне проходження)
  currentAnswer: null,
  missingSlot: 'answer',
  blockStartTime: 0,
};

let currentProfile = null;

// ----- Профілі: збереження/завантаження -----
function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function getActiveProfile() {
  const id = localStorage.getItem(ACTIVE_KEY);
  if (!id) return null;
  return loadProfiles().find(p => p.id === id) || null;
}

function setActiveProfile(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

function createProfile(name, avatar) {
  const profiles = loadProfiles();
  const profile = {
    id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim() || 'Гравець',
    avatar,
    typeProgress: {}, // ключ "op-tier" -> { unlockedLevel }
    stars: 0,
    totalStarsEarned: 0,
    ownedSkins: ['rocket-classic'],
    activeSkin: 'rocket-classic',
    streak: 0,
    lastPlayedDate: null,
    claimedStreakBonuses: [],
    lives: MAX_LIVES,
    livesUpdatedAt: Date.now(),
    blockProgress: {}, // ключ "op-tier-level" -> { unlockedTrack, unlockedTask, completed }
  };
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfile(profile.id);
  return profile;
}

function getStars(profile) {
  return profile.stars || 0;
}

function getOwnedSkins(profile) {
  return profile.ownedSkins || ['rocket-classic'];
}

function getActiveSkinIcon(profile) {
  const skinId = profile.activeSkin || 'rocket-classic';
  const skin = SKINS.find(s => s.id === skinId);
  return skin ? skin.icon : '🚀';
}

function awardStars(profile, amount) {
  profile.stars = getStars(profile) + amount;
  profile.totalStarsEarned = (profile.totalStarsEarned || getStars(profile)) + amount;
  updateProfile(profile);
}

function getRank(profile) {
  const total = profile.totalStarsEarned || profile.stars || 0;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (total >= r.min) rank = r;
  }
  return rank.name;
}

// ----- Стрик -----
function dateKey(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function updateStreak(profile) {
  const today = dateKey(Date.now());
  const lastKey = profile.lastPlayedDate;

  if (lastKey === today) {
    return null; // вже грав сьогодні, стрик не змінюється
  }

  const yesterday = dateKey(Date.now() - 24 * 60 * 60 * 1000);
  profile.streak = lastKey === yesterday ? (profile.streak || 0) + 1 : 1;
  profile.lastPlayedDate = today;

  if (!profile.claimedStreakBonuses) profile.claimedStreakBonuses = [];

  let bonusEarned = null;
  const bonusStars = STREAK_BONUSES[profile.streak];
  if (bonusStars && !profile.claimedStreakBonuses.includes(profile.streak)) {
    profile.claimedStreakBonuses.push(profile.streak);
    awardStars(profile, bonusStars);
    bonusEarned = { days: profile.streak, stars: bonusStars };
  }

  updateProfile(profile);
  return bonusEarned;
}

function getStreak(profile) {
  return profile.streak || 0;
}

// ----- Життя -----
// Перераховує життя з урахуванням часу, що минув (регенерація)
function refreshLives(profile) {
  if (typeof profile.lives !== 'number') profile.lives = MAX_LIVES;
  if (!profile.livesUpdatedAt) profile.livesUpdatedAt = Date.now();

  if (profile.lives >= MAX_LIVES) {
    profile.livesUpdatedAt = Date.now();
    return profile.lives;
  }

  const now = Date.now();
  const elapsed = now - profile.livesUpdatedAt;
  const regenerated = Math.floor(elapsed / LIFE_REGEN_MS);

  if (regenerated > 0) {
    profile.lives = Math.min(MAX_LIVES, profile.lives + regenerated);
    // Переносимо "залишок" часу, щоб не втрачати прогрес до наступного життя
    if (profile.lives >= MAX_LIVES) {
      profile.livesUpdatedAt = now;
    } else {
      profile.livesUpdatedAt = profile.livesUpdatedAt + regenerated * LIFE_REGEN_MS;
    }
    updateProfile(profile);
  }
  return profile.lives;
}

function getLives(profile) {
  return refreshLives(profile);
}

function loseLife(profile) {
  refreshLives(profile);
  if (profile.lives === MAX_LIVES) {
    // якщо життя були повні — запускаємо таймер регенерації від цього моменту
    profile.livesUpdatedAt = Date.now();
  }
  profile.lives = Math.max(0, profile.lives - 1);
  updateProfile(profile);
  return profile.lives;
}

function refillLives(profile) {
  profile.lives = MAX_LIVES;
  profile.livesUpdatedAt = Date.now();
  updateProfile(profile);
}

// Час у мс до відновлення наступного життя (для показу в інфо-вікні)
function msToNextLife(profile) {
  if (getLives(profile) >= MAX_LIVES) return 0;
  const elapsed = Date.now() - profile.livesUpdatedAt;
  return Math.max(0, LIFE_REGEN_MS - elapsed);
}

// ----- Прогрес блоків -----
// Ключ блоку: "add-1-1" = операція-вік-тип (напр. додавання, Космонавт, Таблиця)
function blockKey(op, tier, level) {
  return `${op}-${tier}-${level}`;
}

// Скільки доріжок відкрито (мінімум 1). Кожна доріжка = 10 завдань.
function getUnlockedTrack(profile, op, tier, level) {
  if (!profile.blockProgress) profile.blockProgress = {};
  const key = blockKey(op, tier, level);
  return (profile.blockProgress[key] && profile.blockProgress[key].unlockedTrack) || 1;
}

// Скільки завдань відкрито всередині поточної доріжки (1..10)
function getUnlockedTask(profile, op, tier, level) {
  if (!profile.blockProgress) profile.blockProgress = {};
  const key = blockKey(op, tier, level);
  return (profile.blockProgress[key] && profile.blockProgress[key].unlockedTask) || 1;
}

function setUnlockedTask(profile, op, tier, level, taskNum) {
  if (!profile.blockProgress) profile.blockProgress = {};
  const key = blockKey(op, tier, level);
  if (!profile.blockProgress[key]) profile.blockProgress[key] = { unlockedTrack: 1, unlockedTask: 1 };
  if (taskNum > profile.blockProgress[key].unlockedTask) {
    profile.blockProgress[key].unlockedTask = Math.min(TASKS_PER_BLOCK, taskNum);
  }
  updateProfile(profile);
}

// Відкрити наступну доріжку (після проходження поточної)
function unlockNextTrack(profile, op, tier, level) {
  if (!profile.blockProgress) profile.blockProgress = {};
  const key = blockKey(op, tier, level);
  if (!profile.blockProgress[key]) profile.blockProgress[key] = { unlockedTrack: 1, unlockedTask: 1 };
  profile.blockProgress[key].unlockedTrack += 1;
  profile.blockProgress[key].unlockedTask = 1; // нова доріжка починається з завдання 1
  updateProfile(profile);
}

// Тип (Таблиця/Пропущене/Задачі) вважається "пройденим" якщо відкрито хоч 1 доріжку понад першу зі 100
function isTypeComplete(profile, op, tier, level) {
  if (!profile.blockProgress) return false;
  const key = blockKey(op, tier, level);
  return (profile.blockProgress[key] && profile.blockProgress[key].completed === true);
}

function markTypeComplete(profile, op, tier, level) {
  if (!profile.blockProgress) profile.blockProgress = {};
  const key = blockKey(op, tier, level);
  if (!profile.blockProgress[key]) profile.blockProgress[key] = { unlockedTrack: 1, unlockedTask: TASKS_PER_BLOCK };
  profile.blockProgress[key].completed = true;
  updateProfile(profile);
}

// ----- Лідери -----
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLeaderboard(board) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
}

function submitScore(op, level, profile, points) {
  const board = loadLeaderboard();
  if (!board[op]) board[op] = {};
  if (!board[op][level]) board[op][level] = [];

  board[op][level].push({
    profileId: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    points,
    date: Date.now(),
  });

  board[op][level].sort((a, b) => b.points - a.points);
  board[op][level] = board[op][level].slice(0, 5);

  saveLeaderboard(board);
}

function getLeaders(op, level) {
  const board = loadLeaderboard();
  return (board[op] && board[op][level]) || [];
}

function buySkin(profile, skinId) {
  const skin = SKINS.find(s => s.id === skinId);
  if (!skin) return false;
  const owned = getOwnedSkins(profile);
  if (owned.includes(skinId)) {
    profile.activeSkin = skinId;
    updateProfile(profile);
    return true;
  }
  if (getStars(profile) < skin.price) return false;

  profile.stars = getStars(profile) - skin.price;
  profile.ownedSkins = [...owned, skinId];
  profile.activeSkin = skinId;
  updateProfile(profile);
  return true;
}

function getUnlockedLevel(profile, op, tier) {
  const key = `${op}-${tier}`;
  return (profile.typeProgress && profile.typeProgress[key] && profile.typeProgress[key].unlockedLevel) || 1;
}

function updateProfile(profile) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx > -1) {
    profiles[idx] = profile;
    saveProfiles(profiles);
  }
}

function maybeUnlockNextLevel(profile, op, tier, playedLevel) {
  if (!profile.typeProgress) profile.typeProgress = {};
  const key = `${op}-${tier}`;
  if (!profile.typeProgress[key]) profile.typeProgress[key] = { unlockedLevel: 1 };

  const unlocked = profile.typeProgress[key].unlockedLevel;
  // Тип вважається пройденим, коли завершено першу доріжку (10 завдань)
  if (playedLevel === unlocked && playedLevel < 3) {
    profile.typeProgress[key].unlockedLevel = playedLevel + 1;
    updateProfile(profile);
    return playedLevel + 1;
  }
  return null;
}

// ----- Екрани -----
const screens = {
  profile: document.getElementById('profile-screen'),
  menu: document.getElementById('menu-screen'),
  age: document.getElementById('age-screen'),
  level: document.getElementById('level-screen'),
  block: document.getElementById('block-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
  shop: document.getElementById('shop-screen'),
  leaders: document.getElementById('leaders-screen'),
  nolives: document.getElementById('nolives-screen'),
};

// ----- Toast -----
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ----- Генерація прикладів -----
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(op, tier) {
  tier = tier || 1;
  const r = AGE_TIERS[tier].ranges[op];
  let a, b, answer;

  if (op === 'add') {
    // Генеруємо доданки так, щоб сума не перевищувала maxSum
    for (let attempt = 0; attempt < 50; attempt++) {
      a = randInt(1, r.maxTerm);
      b = randInt(1, r.maxTerm);
      answer = a + b;
      if (answer > r.maxSum) continue;
      // Для рівня без переходу через десяток: одиниці не мають давати перенос
      if (!r.carry && (a % 10) + (b % 10) > 10) continue;
      break;
    }
  } else if (op === 'sub') {
    a = randInt(2, r.maxTerm);
    b = randInt(1, a); // результат не менше 0
    answer = a - b;
  } else if (op === 'mul') {
    for (let attempt = 0; attempt < 50; attempt++) {
      a = randInt(1, r.maxFactor);
      b = randInt(1, r.maxFactor);
      answer = a * b;
      if (r.maxProduct && answer > r.maxProduct) continue;
      break;
    }
  } else if (op === 'div') {
    for (let attempt = 0; attempt < 50; attempt++) {
      b = randInt(1, r.maxFactor);
      answer = randInt(1, r.maxFactor);
      a = b * answer; // ділиться без залишку
      if (r.maxProduct && a > r.maxProduct) continue;
      break;
    }
  }

  return { a, b, answer };
}

function pickMissingSlot() {
  const slots = ['a', 'b', 'answer'];
  return slots[randInt(0, 2)];
}

function fillWordTemplate(op, a, b) {
  const templates = WORD_TEMPLATES[op];
  const template = templates[randInt(0, templates.length - 1)];
  return template(a, b);
}

function generateChoices(answer, op) {
  const choices = new Set([answer]);
  const spread = op === 'mul' || op === 'div' ? Math.max(4, Math.round(answer * 0.3)) : 4;

  while (choices.size < 4) {
    const delta = randInt(-spread, spread);
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) {
      choices.add(candidate);
    }
  }
  return shuffle([...choices]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----- Рендер -----
const numAEl = document.getElementById('num-a');
const numBEl = document.getElementById('num-b');
const opSignEl = document.getElementById('op-sign');
const answerSlotEl = document.getElementById('answer-slot');
const scoreLabelEl = document.getElementById('score-label');
const feedbackEl = document.getElementById('feedback');
const choicesGridEl = document.getElementById('choices-grid');
const rocketEl = document.getElementById('rocket');
const trackFillEl = document.getElementById('track-fill');
const problemCardEl = document.getElementById('problem-card');
const wordViewEl = document.getElementById('word-view');
const starBalanceEl = document.getElementById('star-balance');
const rankLabelEl = document.getElementById('rank-label');
const streakLabelEl = document.getElementById('streak-label');

function renderProblem() {
  const { a, b, answer } = generateProblem(state.op, state.tier);
  const sign = OP_CONFIG[state.op].sign;

  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';

  if (state.level === 3) {
    // Текстова задача: завжди шукаємо результат
    problemCardEl.classList.add('word-mode');
    wordViewEl.textContent = fillWordTemplate(state.op, a, b);
    state.currentAnswer = answer;
  } else {
    problemCardEl.classList.remove('word-mode');

    let missing = 'answer';
    if (state.level === 2) missing = pickMissingSlot();
    state.missingSlot = missing;

    numAEl.textContent = missing === 'a' ? '?' : a;
    opSignEl.textContent = sign;
    numBEl.textContent = missing === 'b' ? '?' : b;
    answerSlotEl.textContent = missing === 'answer' ? '?' : answer;

    state.currentAnswer = missing === 'a' ? a : missing === 'b' ? b : answer;
  }

  const choices = generateChoices(state.currentAnswer, state.op);
  choicesGridEl.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(choice, btn));
    choicesGridEl.appendChild(btn);
  });

  updateScoreLabel();
  updateRocketPosition();
}

function updateScoreLabel() {
  scoreLabelEl.textContent = `Завдання ${state.taskNum} / ${TASKS_PER_BLOCK}`;
}

function updateRocketPosition() {
  // Ракета показує позицію поточного завдання в блоці
  const pct = ((state.taskNum - 1) / TASKS_PER_BLOCK) * 92;
  rocketEl.style.left = `calc(${pct}% + 4%)`;
  trackFillEl.style.width = `calc(${pct}% + 4%)`;
}

function handleAnswer(choice, btn) {
  const allBtns = [...choicesGridEl.children];
  allBtns.forEach(b => b.classList.add('disabled'));

  const isCorrect = choice === state.currentAnswer;

  // Показуємо правильну відповідь у рівнянні
  const revealAnswer = () => {
    if (state.level !== 3) {
      if (state.missingSlot === 'a') numAEl.textContent = state.currentAnswer;
      else if (state.missingSlot === 'b') numBEl.textContent = state.currentAnswer;
      else answerSlotEl.textContent = state.currentAnswer;
    }
  };

  if (isCorrect) {
    btn.classList.add('correct-flash');
    feedbackEl.textContent = pickEncouragement(true);
    feedbackEl.className = 'feedback correct';
    revealAnswer();
    state.correctCount++;

    // Зберігаємо прогрес: відкриваємо наступне завдання
    if (currentProfile) {
      setUnlockedTask(currentProfile, state.op, state.tier, state.level, state.taskNum + 1);
    }

    setTimeout(() => {
      if (state.taskNum >= TASKS_PER_BLOCK) {
        finishBlock();
      } else {
        state.taskNum++;
        renderProblem();
      }
    }, 900);
  } else {
    // Помилка: -1 життя, повторюємо це саме завдання
    btn.classList.add('wrong-flash');
    allBtns.forEach(b => {
      if (parseInt(b.textContent, 10) === state.currentAnswer) {
        b.classList.add('correct-flash');
      }
    });

    let livesLeft = MAX_LIVES;
    if (currentProfile) {
      livesLeft = loseLife(currentProfile);
      updateLivesBadges();
    }
    state.blockMistakes++;

    feedbackEl.textContent = `Спробуй ще! ${'❤️'.repeat(livesLeft) || 'Життя скінчились'}`;
    feedbackEl.className = 'feedback wrong';

    setTimeout(() => {
      if (livesLeft <= 0) {
        showNoLives();
      } else {
        renderProblem(); // те саме завдання, нова генерація
      }
    }, 1100);
  }
}

function pickEncouragement(correct) {
  const good = ['Так!', 'Чудово!', 'Молодець!', 'Влучно!', 'Супер!'];
  const soft = ['Майже!', 'Спробуй ще!', 'Не здавайся!', 'Наступного разу вийде!'];
  const list = correct ? good : soft;
  return list[randInt(0, list.length - 1)];
}

// ----- Результат -----
const resultTitle = document.getElementById('result-title');
const resultText = document.getElementById('result-text');
const unlockMessageEl = document.getElementById('unlock-message');
const starsEarnedEl = document.getElementById('stars-earned');
const streakMessageEl = document.getElementById('streak-message');

function finishBlock() {
  updateRocketPosition();
  const correct = state.correctCount;

  resultTitle.textContent = 'Доріжку пройдено! 🌟';
  resultText.textContent = `Ти впорався з усіма ${TASKS_PER_BLOCK} завданнями!`;

  unlockMessageEl.textContent = '';
  starsEarnedEl.textContent = '';
  streakMessageEl.textContent = '';

  if (currentProfile) {
    const perfect = state.blockMistakes === 0;
    const earned = perfect ? 3 : 1;
    awardStars(currentProfile, earned);
    starsEarnedEl.textContent = `+${earned} ⭐`;

    const elapsedSeconds = Math.floor((Date.now() - state.blockStartTime) / 1000);
    const points = Math.max(0, correct * 10 - elapsedSeconds);
    submitScore(state.op, state.level, currentProfile, points);

    // Відкриваємо наступну доріжку (якщо ще не відкрита)
    const unlockedTrack = getUnlockedTrack(currentProfile, state.op, state.tier, state.level);
    if (state.track >= unlockedTrack) {
      unlockNextTrack(currentProfile, state.op, state.tier, state.level);
    }

    // Тип вважається "пройденим" після першої доріжки → відкриваємо наступний тип
    if (state.track === 1) {
      markTypeComplete(currentProfile, state.op, state.tier, state.level);
      const newLevel = maybeUnlockNextLevel(currentProfile, state.op, state.tier, state.level);
      if (newLevel) {
        unlockMessageEl.textContent = `🎉 Наступний рівень відкрито!`;
      }
    }

    const streakBonus = updateStreak(currentProfile);
    if (streakBonus) {
      streakMessageEl.textContent = `🔥 ${streakBonus.days} днів підряд! +${streakBonus.stars} ⭐`;
    }
    updateStarBalance();
  }

  setTimeout(() => showScreen('result'), 500);
}

// ----- Старт блоку (доріжки) -----
function startBlock(op, tier, level, track, startTask) {
  // Перевірка життів перед стартом
  if (currentProfile && getLives(currentProfile) <= 0) {
    showNoLives();
    return;
  }

  state.op = op;
  state.tier = tier;
  state.level = level;
  state.track = track || 1;
  state.taskNum = startTask || 1;
  state.correctCount = 0;
  state.blockMistakes = 0;
  state.blockStartTime = Date.now();

  const skinIcon = currentProfile ? getActiveSkinIcon(currentProfile) : '🚀';
  rocketEl.textContent = skinIcon;
  document.querySelector('.result-rocket').textContent = skinIcon;

  updateLivesBadges();
  showScreen('game');
  renderProblem();
}

// ----- Екран вибору вікового рівня -----
const ageListEl = document.getElementById('age-list');
const ageOpTitleEl = document.getElementById('age-op-title');
let currentOp = 'add';
let currentTier = 1;

function renderAgeScreen(op) {
  currentOp = op;
  ageOpTitleEl.textContent = OP_CONFIG[op].label;

  ageListEl.innerHTML = '';
  [1, 2, 3].forEach(tier => {
    const meta = AGE_TIERS[tier];
    const btn = document.createElement('button');
    btn.className = 'level-card';
    btn.innerHTML = `
      <span class="level-icon">${meta.icon}</span>
      <span class="level-text">
        <span class="level-name">${meta.name}</span>
        <span class="level-hint">${meta.ageHint}</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      currentTier = tier;
      renderLevelScreen(op, tier);
      showScreen('level');
    });
    ageListEl.appendChild(btn);
  });
}

// ----- Екран вибору типу завдань -----
const levelListEl = document.getElementById('level-list');
const levelOpTitleEl = document.getElementById('level-op-title');
const levelSubtitleEl = document.getElementById('level-subtitle');

function renderLevelScreen(op, tier) {
  currentOp = op;
  currentTier = tier;
  levelOpTitleEl.textContent = OP_CONFIG[op].label;
  levelSubtitleEl.textContent = `${AGE_TIERS[tier].name} · обери рівень`;
  const unlocked = currentProfile ? getUnlockedLevel(currentProfile, op, tier) : 1;

  levelListEl.innerHTML = '';
  [1, 2, 3].forEach(level => {
    const meta = LEVEL_META[level];
    const isLocked = level > unlocked;

    const btn = document.createElement('button');
    btn.className = 'level-card' + (isLocked ? ' locked' : '');
    btn.innerHTML = `
      <span class="level-icon">${meta.icon}</span>
      <span class="level-text">
        <span class="level-name">${meta.name}</span>
        <span class="level-hint">${meta.hint}</span>
      </span>
      ${isLocked ? '<span class="level-lock">🔒</span>' : ''}
    `;
    btn.addEventListener('click', () => {
      if (isLocked) {
        showToast(`🔒 Пройди попередній рівень, щоб відкрити`);
      } else {
        openBlock(op, tier, level);
      }
    });
    levelListEl.appendChild(btn);
  });
}

// ----- Карта блоку (доріжка) -----
const blockMapEl = document.getElementById('block-map');
const blockTitleEl = document.getElementById('block-title');
const blockSubtitleEl = document.getElementById('block-subtitle');
const trackIndicatorEl = document.getElementById('track-indicator');
const nextTrackBtn = document.getElementById('next-track-btn');

function openBlock(op, tier, level) {
  currentOp = op;
  currentTier = tier;
  currentBlockLevel = level;
  state.op = op;
  state.tier = tier;
  state.level = level;
  state.track = currentProfile ? getUnlockedTrack(currentProfile, op, tier, level) : 1;
  blockTitleEl.textContent = LEVEL_META[level].name;
  blockSubtitleEl.textContent = `${OP_CONFIG[op].label} · ${AGE_TIERS[tier].name}`;
  updateLivesBadges();
  renderBlockMap();
  showScreen('block');
}

let currentBlockLevel = 1;

function renderBlockMap() {
  const op = state.op, tier = state.tier, level = state.level;
  const unlockedTrack = currentProfile ? getUnlockedTrack(currentProfile, op, tier, level) : 1;
  const track = state.track;
  const unlockedTask = (track < unlockedTrack)
    ? TASKS_PER_BLOCK + 1  // доріжка вже повністю пройдена
    : (currentProfile ? getUnlockedTask(currentProfile, op, tier, level) : 1);

  // Індикатор доріжки та завдань
  const totalTaskNum = (track - 1) * TASKS_PER_BLOCK;
  trackIndicatorEl.textContent = `Доріжка ${track} з ${TRACKS_PER_TIER}  ·  завдань пройдено: ${totalTaskNum + Math.min(unlockedTask - 1, TASKS_PER_BLOCK)}/100`;

  blockMapEl.innerHTML = '';
  for (let task = 1; task <= TASKS_PER_BLOCK; task++) {
    if (task > 1) {
      const connector = document.createElement('div');
      connector.className = 'station-connector' + (task <= unlockedTask ? ' done' : '');
      blockMapEl.appendChild(connector);
    }

    const station = document.createElement('div');
    station.className = 'map-station';

    const dot = document.createElement('button');
    const isDone = task < unlockedTask;
    const isCurrent = task === unlockedTask;
    const isLocked = task > unlockedTask;

    dot.className = 'station-dot' +
      (isDone ? ' done' : '') +
      (isCurrent ? ' current' : '') +
      (isLocked ? ' locked' : '');
    dot.textContent = isDone ? '✓' : task;

    dot.addEventListener('click', () => {
      if (isLocked) {
        showToast('🔒 Спочатку пройди попередні завдання');
        return;
      }
      startBlock(op, tier, level, track, task);
    });

    station.appendChild(dot);
    blockMapEl.appendChild(station);
  }

  // Кнопка "Далі" — показуємо, якщо поточну доріжку пройдено і можна перейти на наступну
  const trackDone = unlockedTask > TASKS_PER_BLOCK;
  if (trackDone && track < TRACKS_PER_TIER) {
    nextTrackBtn.style.display = 'block';
    nextTrackBtn.textContent = `Доріжка ${track + 1} ▶`;
    nextTrackBtn.onclick = () => {
      state.track = track + 1;
      renderBlockMap();
    };
  } else if (trackDone && track >= TRACKS_PER_TIER) {
    // Усі 100 завдань пройдено — генеруємо ще
    nextTrackBtn.style.display = 'block';
    nextTrackBtn.textContent = 'Ще завдання ▶';
    nextTrackBtn.onclick = () => {
      state.track = track + 1;
      renderBlockMap();
    };
  } else {
    nextTrackBtn.style.display = 'none';
  }
}

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    renderAgeScreen(card.dataset.op);
    showScreen('age');
  });
});

document.getElementById('age-back-btn').addEventListener('click', () => showScreen('menu'));
document.getElementById('level-back-btn').addEventListener('click', () => {
  renderAgeScreen(currentOp);
  showScreen('age');
});
document.getElementById('block-back-btn').addEventListener('click', () => {
  renderLevelScreen(currentOp, currentTier);
  showScreen('level');
});

// ----- Магазин скінів -----
const shopGridEl = document.getElementById('shop-grid');
const shopStarBalanceEl = document.getElementById('shop-star-balance');

function renderShop() {
  if (!currentProfile) return;
  shopStarBalanceEl.textContent = `⭐ ${getStars(currentProfile)}`;
  const owned = getOwnedSkins(currentProfile);
  const active = currentProfile.activeSkin || 'rocket-classic';

  shopGridEl.innerHTML = '';
  SKINS.forEach(skin => {
    const isOwned = owned.includes(skin.id);
    const isActive = skin.id === active;
    const canAfford = getStars(currentProfile) >= skin.price;

    const btn = document.createElement('button');
    btn.className = 'shop-item' + (isActive ? ' active' : '') + (!isOwned && !canAfford ? ' locked' : '');
    btn.innerHTML = `
      <span class="shop-item-icon">${skin.icon}</span>
      ${isActive ? '<span class="shop-item-status">✓ Обрано</span>' :
        isOwned ? '<span class="shop-item-status">Обрати</span>' :
        `<span class="shop-item-price">⭐ ${skin.price}</span>`}
    `;
    btn.addEventListener('click', () => {
      if (isActive) return;
      if (!isOwned && !canAfford) {
        showToast(`Потрібно ще ${skin.price - getStars(currentProfile)} ⭐`);
        return;
      }
      buySkin(currentProfile, skin.id);
      renderShop();
      updateStarBalance();
    });
    shopGridEl.appendChild(btn);
  });
}

document.getElementById('open-shop-btn').addEventListener('click', () => {
  renderShop();
  showScreen('shop');
});

document.getElementById('shop-back-btn').addEventListener('click', () => showScreen('menu'));

// ----- Екран лідерів -----
const opTabsEl = document.getElementById('op-tabs');
const levelTabsEl = document.getElementById('level-tabs');
const leadersListEl = document.getElementById('leaders-list');
let leaderOp = 'add';
let leaderLevel = 1;

function renderOpTabs() {
  opTabsEl.innerHTML = '';
  Object.keys(OP_CONFIG).forEach(op => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (op === leaderOp ? ' active' : '');
    btn.textContent = OP_CONFIG[op].label;
    btn.addEventListener('click', () => {
      leaderOp = op;
      renderOpTabs();
      renderLeadersList();
    });
    opTabsEl.appendChild(btn);
  });
}

function renderLevelTabs() {
  levelTabsEl.innerHTML = '';
  [1, 2, 3].forEach(level => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (level === leaderLevel ? ' active' : '');
    btn.textContent = LEVEL_META[level].name;
    btn.addEventListener('click', () => {
      leaderLevel = level;
      renderLevelTabs();
      renderLeadersList();
    });
    levelTabsEl.appendChild(btn);
  });
}

function renderLeadersList() {
  const leaders = getLeaders(leaderOp, leaderLevel);
  leadersListEl.innerHTML = '';

  if (leaders.length === 0) {
    leadersListEl.innerHTML = '<p class="leaders-empty">Ще ніхто не грав цей рівень. Будь першим!</p>';
    return;
  }

  leaders.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'leader-row';
    row.innerHTML = `
      <span class="leader-rank">${i + 1}</span>
      <span class="leader-avatar">${entry.avatar}</span>
      <span class="leader-name">${entry.name}</span>
      <span class="leader-points">${entry.points}</span>
    `;
    leadersListEl.appendChild(row);
  });
}

document.getElementById('open-leaders-btn').addEventListener('click', () => {
  renderOpTabs();
  renderLevelTabs();
  renderLeadersList();
  showScreen('leaders');
});

document.getElementById('leaders-back-btn').addEventListener('click', () => showScreen('menu'));

// Кнопка "назад" у грі повертає на карту блоку
document.getElementById('back-btn').addEventListener('click', () => {
  renderBlockMap();
  showScreen('block');
});

// "Грати ще раз" на екрані результату - повертає на карту блоку
document.getElementById('play-again-btn').addEventListener('click', () => {
  renderBlockMap();
  showScreen('block');
});

// ----- Життя: бейджі, модалка, екран "без життів" -----
const menuLivesBadge = document.getElementById('lives-badge');
const gameLivesBadge = document.getElementById('game-lives-badge');
const blockLivesBadge = document.getElementById('block-lives-badge');
const livesModal = document.getElementById('lives-modal');
const livesModalTimer = document.getElementById('lives-modal-timer');
const noLivesText = document.getElementById('nolives-text');

function updateLivesBadges() {
  if (!currentProfile) return;
  const lives = getLives(currentProfile);
  const text = `❤️ ${lives}`;
  if (menuLivesBadge) menuLivesBadge.textContent = text;
  if (gameLivesBadge) gameLivesBadge.textContent = text;
  if (blockLivesBadge) blockLivesBadge.textContent = text;
}

function formatMs(ms) {
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h} год ${m} хв`;
  }
  return `${totalMin} хв`;
}

function openLivesModal() {
  if (!currentProfile) return;
  const lives = getLives(currentProfile);
  if (lives >= MAX_LIVES) {
    livesModalTimer.textContent = 'Усі життя повні!';
  } else {
    livesModalTimer.textContent = `Наступне життя через ${formatMs(msToNextLife(currentProfile))}`;
  }
  livesModal.classList.add('show');
}

function closeLivesModal() {
  livesModal.classList.remove('show');
}

[menuLivesBadge, gameLivesBadge, blockLivesBadge].forEach(badge => {
  if (badge) badge.addEventListener('click', openLivesModal);
});
document.getElementById('lives-modal-close').addEventListener('click', closeLivesModal);
livesModal.addEventListener('click', (e) => {
  if (e.target === livesModal) closeLivesModal();
});

function showNoLives() {
  if (currentProfile && getLives(currentProfile) < MAX_LIVES) {
    noLivesText.textContent = `Наступне життя через ${formatMs(msToNextLife(currentProfile))}. Отримай ще прямо зараз!`;
  }
  showScreen('nolives');
}

// Тимчасово: кнопка реклами одразу дає +5 (місце під реальну рекламу)
document.getElementById('watch-ad-btn').addEventListener('click', () => {
  if (currentProfile) {
    refillLives(currentProfile);
    updateLivesBadges();
  }
  showToast('❤️ Життя відновлено!');
  renderBlockMap();
  showScreen('block');
});

document.getElementById('nolives-menu-btn').addEventListener('click', () => showScreen('menu'));

// ----- Екран профілю: рендер і обробники -----
document.getElementById('menu-btn').addEventListener('click', () => showScreen('menu'));

const profileListEl = document.getElementById('profile-list');
const avatarGridEl = document.getElementById('avatar-grid');
const nameInputEl = document.getElementById('name-input');
const createProfileBtn = document.getElementById('create-profile-btn');
const addProfileBtn = document.getElementById('add-profile-btn');
const newProfileFormEl = document.getElementById('new-profile-form');
const profileAvatarBadgeEl = document.getElementById('profile-avatar-badge');
const greetingEl = document.getElementById('greeting');

let selectedAvatar = AVATARS[0];

function renderAvatarGrid() {
  avatarGridEl.innerHTML = '';
  AVATARS.forEach(avatar => {
    const btn = document.createElement('button');
    btn.className = 'avatar-option';
    btn.textContent = avatar;
    if (avatar === selectedAvatar) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedAvatar = avatar;
      [...avatarGridEl.children].forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
    });
    avatarGridEl.appendChild(btn);
  });
}

function renderProfileScreen() {
  const profiles = loadProfiles();
  profileListEl.innerHTML = '';

  if (profiles.length === 0) {
    newProfileFormEl.style.display = 'flex';
    addProfileBtn.style.display = 'none';
  } else {
    profiles.forEach(profile => {
      const btn = document.createElement('button');
      btn.className = 'profile-item';
      btn.innerHTML = `<span class="avatar-emoji">${profile.avatar}</span><span>${profile.name}</span>`;
      btn.addEventListener('click', () => enterApp(profile));
      profileListEl.appendChild(btn);
    });
    newProfileFormEl.style.display = 'none';
    addProfileBtn.style.display = 'block';
  }
  renderAvatarGrid();
}

function enterApp(profile) {
  currentProfile = profile;
  setActiveProfile(profile.id);
  profileAvatarBadgeEl.textContent = profile.avatar;
  greetingEl.textContent = `Привіт, ${profile.name}! Обери, що будемо вивчати`;
  updateStarBalance();
  updateLivesBadges();
  showScreen('menu');
}

function updateStarBalance() {
  if (!currentProfile) return;
  starBalanceEl.textContent = `⭐ ${getStars(currentProfile)}`;
  rankLabelEl.textContent = `Ранг: ${getRank(currentProfile)}`;
  streakLabelEl.textContent = `🔥 ${getStreak(currentProfile)}`;
}

createProfileBtn.addEventListener('click', () => {
  const name = nameInputEl.value.trim();
  if (!name) {
    nameInputEl.focus();
    return;
  }
  const profile = createProfile(name, selectedAvatar);
  enterApp(profile);
});

addProfileBtn.addEventListener('click', () => {
  newProfileFormEl.style.display = 'flex';
  addProfileBtn.style.display = 'none';
  nameInputEl.value = '';
  selectedAvatar = AVATARS[0];
  renderAvatarGrid();
});

document.getElementById('switch-profile-btn').addEventListener('click', () => {
  renderProfileScreen();
  showScreen('profile');
});

// ----- Старт застосунку -----
(function initApp() {
  const active = getActiveProfile();
  if (active) {
    enterApp(active);
  } else {
    renderProfileScreen();
    showScreen('profile');
  }
})();
