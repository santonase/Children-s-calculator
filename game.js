// ===== Дитячий калькулятор — логіка гри =====

const TOTAL_QUESTIONS = 10;
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
  level: 1,
  round: 0,
  score: 0,
  currentAnswer: null,
  missingSlot: 'answer',
  currentA: null,
  currentB: null,
  roundStartTime: 0,
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
    progress: { add: { unlockedLevel: 1 }, sub: { unlockedLevel: 1 }, mul: { unlockedLevel: 1 }, div: { unlockedLevel: 1 } },
    stars: 0,
    totalStarsEarned: 0,
    ownedSkins: ['rocket-classic'],
    activeSkin: 'rocket-classic',
    streak: 0,
    lastPlayedDate: null,
    claimedStreakBonuses: [],
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

function getUnlockedLevel(profile, op) {
  return (profile.progress && profile.progress[op] && profile.progress[op].unlockedLevel) || 1;
}

function updateProfile(profile) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx > -1) {
    profiles[idx] = profile;
    saveProfiles(profiles);
  }
}

function maybeUnlockNextLevel(profile, op, playedLevel, score) {
  if (!profile.progress) profile.progress = {};
  if (!profile.progress[op]) profile.progress[op] = { unlockedLevel: 1 };

  const unlocked = profile.progress[op].unlockedLevel;
  if (playedLevel === unlocked && playedLevel < 3 && score >= 8) {
    profile.progress[op].unlockedLevel = playedLevel + 1;
    updateProfile(profile);
    return playedLevel + 1;
  }
  return null;
}

// ----- Екрани -----
const screens = {
  profile: document.getElementById('profile-screen'),
  menu: document.getElementById('menu-screen'),
  level: document.getElementById('level-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
  shop: document.getElementById('shop-screen'),
  leaders: document.getElementById('leaders-screen'),
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

function generateProblem(op) {
  let a, b, answer;

  if (op === 'add') {
    a = randInt(1, RANGE);
    b = randInt(1, RANGE);
    answer = a + b;
  } else if (op === 'sub') {
    a = randInt(1, RANGE);
    b = randInt(1, a); // щоб результат був не менше 0
    answer = a - b;
  } else if (op === 'mul') {
    a = randInt(1, RANGE);
    b = randInt(1, RANGE);
    answer = a * b;
  } else if (op === 'div') {
    b = randInt(1, RANGE);
    answer = randInt(1, RANGE);
    a = b * answer; // ділиться без залишку
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
  const { a, b, answer } = generateProblem(state.op);
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
  scoreLabelEl.textContent = `${state.round} / ${TOTAL_QUESTIONS}`;
}

function updateRocketPosition() {
  const pct = (state.round / TOTAL_QUESTIONS) * 92; // залишаємо запас справа
  rocketEl.style.left = `calc(${pct}% + 4%)`;
  trackFillEl.style.width = `calc(${pct}% + 4%)`;
}

function handleAnswer(choice, btn) {
  const allBtns = [...choicesGridEl.children];
  allBtns.forEach(b => b.classList.add('disabled'));

  const isCorrect = choice === state.currentAnswer;

  if (isCorrect) {
    btn.classList.add('correct-flash');
    feedbackEl.textContent = pickEncouragement(true);
    feedbackEl.className = 'feedback correct';
    state.score++;
  } else {
    btn.classList.add('wrong-flash');
    feedbackEl.textContent = pickEncouragement(false);
    feedbackEl.className = 'feedback wrong';
    allBtns.forEach(b => {
      if (parseInt(b.textContent, 10) === state.currentAnswer) {
        b.classList.add('correct-flash');
      }
    });
  }

  if (state.level !== 3) {
    if (state.missingSlot === 'a') numAEl.textContent = state.currentAnswer;
    else if (state.missingSlot === 'b') numBEl.textContent = state.currentAnswer;
    else answerSlotEl.textContent = state.currentAnswer;
  }
  state.round++;

  setTimeout(() => {
    if (state.round >= TOTAL_QUESTIONS) {
      finishRound();
    } else {
      renderProblem();
    }
  }, 900);
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

function finishRound() {
  updateRocketPosition();
  const score = state.score;

  let title;
  if (score === TOTAL_QUESTIONS) title = 'Ти зірка космосу! 🌟';
  else if (score >= TOTAL_QUESTIONS * 0.7) title = 'Чудовий результат!';
  else if (score >= TOTAL_QUESTIONS * 0.4) title = 'Гарний старт!';
  else title = 'Тренуємось далі!';

  resultTitle.textContent = title;
  resultText.textContent = `Правильних відповідей: ${score} з ${TOTAL_QUESTIONS}`;

  unlockMessageEl.textContent = '';
  starsEarnedEl.textContent = '';
  streakMessageEl.textContent = '';

  if (currentProfile) {
    const earned = score === TOTAL_QUESTIONS ? 3 : 1;
    awardStars(currentProfile, earned);
    starsEarnedEl.textContent = `+${earned} ⭐`;

    const elapsedSeconds = Math.floor((Date.now() - state.roundStartTime) / 1000);
    const points = Math.max(0, score * 10 - elapsedSeconds);
    submitScore(state.op, state.level, currentProfile, points);

    const streakBonus = updateStreak(currentProfile);
    if (streakBonus) {
      streakMessageEl.textContent = `🔥 ${streakBonus.days} днів підряд! +${streakBonus.stars} ⭐`;
    }
    updateStarBalance();

    const newLevel = maybeUnlockNextLevel(currentProfile, state.op, state.level, score);
    if (newLevel) {
      unlockMessageEl.textContent = `🎉 Рівень ${newLevel} відкрито!`;
    }
  }

  setTimeout(() => showScreen('result'), 500);
}

// ----- Старт нового раунду -----
function startRound(op, level) {
  state.op = op;
  state.level = level;
  state.round = 0;
  state.score = 0;
  state.roundStartTime = Date.now();
  const skinIcon = currentProfile ? getActiveSkinIcon(currentProfile) : '🚀';
  rocketEl.textContent = skinIcon;
  document.querySelector('.result-rocket').textContent = skinIcon;
  rocketEl.style.left = '4%';
  trackFillEl.style.width = '4%';
  showScreen('game');
  renderProblem();
}

// ----- Екран вибору рівня -----
const levelListEl = document.getElementById('level-list');
const levelOpTitleEl = document.getElementById('level-op-title');
let currentLevelOp = 'add';

function renderLevelScreen(op) {
  currentLevelOp = op;
  levelOpTitleEl.textContent = OP_CONFIG[op].label;
  const unlocked = currentProfile ? getUnlockedLevel(currentProfile, op) : 1;

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
        showToast(`🔒 Пройди попередній рівень на 8/10, щоб відкрити`);
      } else {
        startRound(op, level);
      }
    });
    levelListEl.appendChild(btn);
  });
}

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    renderLevelScreen(card.dataset.op);
    showScreen('level');
  });
});

document.getElementById('level-back-btn').addEventListener('click', () => showScreen('menu'));

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

document.getElementById('back-btn').addEventListener('click', () => showScreen('level'));

document.getElementById('play-again-btn').addEventListener('click', () => startRound(state.op, state.level));

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
