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

let state = {
  op: 'add',
  round: 0,
  score: 0,
  currentAnswer: null,
};

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
  };
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfile(profile.id);
  return profile;
}

// ----- Екрани -----
const screens = {
  profile: document.getElementById('profile-screen'),
  menu: document.getElementById('menu-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
};

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

function renderProblem() {
  const { a, b, answer } = generateProblem(state.op);
  state.currentAnswer = answer;

  numAEl.textContent = a;
  numBEl.textContent = b;
  opSignEl.textContent = OP_CONFIG[state.op].sign;
  answerSlotEl.textContent = '?';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';

  const choices = generateChoices(answer, state.op);
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

  answerSlotEl.textContent = state.currentAnswer;
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

  setTimeout(() => showScreen('result'), 500);
}

// ----- Старт нового раунду -----
function startRound(op) {
  state.op = op;
  state.round = 0;
  state.score = 0;
  rocketEl.style.left = '4%';
  trackFillEl.style.width = '4%';
  showScreen('game');
  renderProblem();
}

// ----- Обробники подій -----
document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => startRound(card.dataset.op));
});

document.getElementById('back-btn').addEventListener('click', () => showScreen('menu'));

document.getElementById('play-again-btn').addEventListener('click', () => startRound(state.op));

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
  setActiveProfile(profile.id);
  profileAvatarBadgeEl.textContent = profile.avatar;
  greetingEl.textContent = `Привіт, ${profile.name}! Обери, що будемо вивчати`;
  showScreen('menu');
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
