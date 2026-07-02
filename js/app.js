// ===== Застосунок: стан, екрани, обробники =====

let state = {
  op: 'add',
  grade: 1,          // клас НУШ (1-4)
  level: 1,          // тип завдання (1=Таблиця, 2=Пропущене, 3=Задачі)
  track: 1,          // номер доріжки (1..10, далі нескінченно)
  taskNum: 1,        // поточне завдання в доріжці (1..10)
  correctCount: 0,   // скільки завдань доріжки пройдено правильно
  blockMistakes: 0,  // помилок за поточну доріжку (для бонусу за ідеальне проходження)
  currentAnswer: null,
  missingSlot: 'answer',
  currentA: null,
  currentB: null,
  currentFullAnswer: null,
  currentWordText: null,
  blockStartTime: 0,
};

let currentProfile = null;
// ----- Екрани -----
const screens = {
  profile: document.getElementById('profile-screen'),
  menu: document.getElementById('menu-screen'),
  grade: document.getElementById('grade-screen'),
  level: document.getElementById('level-screen'),
  block: document.getElementById('block-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
  shop: document.getElementById('shop-screen'),
  leaders: document.getElementById('leaders-screen'),
  badges: document.getElementById('badges-screen'),
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
const hintPanelEl = document.getElementById('hint-panel');
const speakBtnEl = document.getElementById('speak-btn');
const starBalanceEl = document.getElementById('star-balance');
const rankLabelEl = document.getElementById('rank-label');
const streakLabelEl = document.getElementById('streak-label');

function renderProblem() {
  const problem = generateProblem(state.op, state.grade);
  const { a, b, answer } = problem;
  const sign = OP_CONFIG[state.op].sign;

  state.currentA = a;
  state.currentB = b;
  state.currentFullAnswer = answer;

  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  hintPanelEl.classList.remove('show');

  // Порядок дій та частини показуємо як текстовий вираз (режим word-mode)
  if (state.op === 'order' || state.op === 'frac') {
    problemCardEl.classList.add('word-mode');
    wordViewEl.textContent = `${problem.expr} = ?`;
    state.currentWordText = problem.expr;
    state.currentAnswer = answer;
    state.missingSlot = 'answer';
  } else if (state.level === 3) {
    // Текстова задача: завжди шукаємо результат
    problemCardEl.classList.add('word-mode');
    const wordText = fillWordTemplate(state.op, a, b);
    wordViewEl.textContent = wordText;
    state.currentWordText = wordText;
    state.currentAnswer = answer;
    state.missingSlot = 'answer';
  } else {
    problemCardEl.classList.remove('word-mode');
    state.currentWordText = null;

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

// Озвучення поточного завдання
function speakCurrentProblem() {
  if (state.currentWordText) {
    speak(state.currentWordText);
  } else {
    speak(equationToSpeech(state.op, state.currentA, state.currentB, state.currentFullAnswer, state.missingSlot));
  }
}

speakBtnEl.addEventListener('click', speakCurrentProblem);

function updateScoreLabel() {
  scoreLabelEl.textContent = T.taskCounter(state.taskNum, TASKS_PER_BLOCK);
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
    soundCorrect();
    vibrateCorrect();
    state.correctCount++;

    // Зберігаємо прогрес: відкриваємо наступне завдання
    if (currentProfile) {
      setUnlockedTask(currentProfile, state.op, state.grade, state.level, state.taskNum + 1);
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
    // Помилка: -1 життя, показуємо підказку, повторюємо це саме завдання
    btn.classList.add('wrong-flash');
    allBtns.forEach(b => {
      if (parseInt(b.textContent, 10) === state.currentAnswer) {
        b.classList.add('correct-flash');
      }
    });
    soundWrong();
    vibrateWrong();

    let livesLeft = MAX_LIVES;
    if (currentProfile) {
      livesLeft = loseLife(currentProfile);
      updateLivesBadges();
    }
    state.blockMistakes++;

    feedbackEl.textContent = T.tryAgainLives('❤️'.repeat(livesLeft) || T.livesGone);
    feedbackEl.className = 'feedback wrong';

    // Показуємо пояснення-підказку
    hintPanelEl.innerHTML = buildHint(state.op, state.currentA, state.currentB, state.currentFullAnswer);
    hintPanelEl.classList.add('show');

    setTimeout(() => {
      if (livesLeft <= 0) {
        showNoLives();
      } else {
        renderProblem(); // те саме завдання, нова генерація
      }
    }, 2200);
  }
}

function pickEncouragement(correct) {
  const list = correct ? T.encouragementsGood : T.encouragementsSoft;
  return list[randInt(0, list.length - 1)];
}

// ----- Результат -----
const resultTitle = document.getElementById('result-title');
const resultText = document.getElementById('result-text');
const unlockMessageEl = document.getElementById('unlock-message');
const starsEarnedEl = document.getElementById('stars-earned');
const streakMessageEl = document.getElementById('streak-message');
const chestMessageEl = document.getElementById('chest-message');
const badgeMessageEl = document.getElementById('badge-message');

function finishBlock() {
  updateRocketPosition();
  const correct = state.correctCount;
  soundTrackDone();
  vibrateTrackDone();

  resultTitle.textContent = T.trackDoneTitle;
  resultText.textContent = T.trackDoneText(TASKS_PER_BLOCK);

  unlockMessageEl.textContent = '';
  starsEarnedEl.textContent = '';
  streakMessageEl.textContent = '';
  chestMessageEl.textContent = '';
  badgeMessageEl.textContent = '';

  if (currentProfile) {
    const perfect = state.blockMistakes === 0;
    const earned = perfect ? 3 : 1;
    awardStars(currentProfile, earned);
    starsEarnedEl.textContent = T.starsEarned(earned);

    if (perfect) registerPerfectTrack(currentProfile);

    const elapsedSeconds = Math.floor((Date.now() - state.blockStartTime) / 1000);
    const points = Math.max(0, correct * 10 - elapsedSeconds);
    submitScore(state.op, state.level, currentProfile, points);

    // Відкриваємо наступну доріжку (якщо ще не відкрита)
    const unlockedTrack = getUnlockedTrack(currentProfile, state.op, state.grade, state.level);
    if (state.track >= unlockedTrack) {
      unlockNextTrack(currentProfile, state.op, state.grade, state.level);
    }

    // Тип вважається "пройденим" після першої доріжки → відкриваємо наступний тип
    if (state.track === 1) {
      markTypeComplete(currentProfile, state.op, state.grade, state.level);
      const newLevel = maybeUnlockNextLevel(currentProfile, state.op, state.grade, state.level);
      if (newLevel) {
        unlockMessageEl.textContent = T.nextLevelUnlocked;
      }
    }

    // Сундук-нагорода за кожну 5-ту доріжку
    const chest = maybeChestReward(currentProfile);
    if (chest > 0) {
      chestMessageEl.textContent = T.chestReward(chest);
      soundPurchase();
    }

    // Щоденна ціль
    const goalDone = registerDailyProgress(currentProfile);
    if (goalDone) {
      chestMessageEl.textContent = (chestMessageEl.textContent ? chestMessageEl.textContent + '  ' : '') + T.dailyGoalDone;
    }

    const streakBonus = updateStreak(currentProfile);
    if (streakBonus) {
      streakMessageEl.textContent = T.streakBonus(streakBonus.days, streakBonus.stars);
    }

    // Перевірка бейджів (після всіх нарахувань)
    const newBadges = checkBadges(currentProfile);
    if (newBadges.length > 0) {
      badgeMessageEl.textContent = T.badgeUnlocked(newBadges[0].icon, newBadges[0].name);
    }

    updateStarBalance();
    updateDailyGoal();
  }

  setTimeout(() => showScreen('result'), 500);
}

// ----- Старт блоку (доріжки) -----
function startBlock(op, grade, level, track, startTask) {
  // Перевірка життів перед стартом
  if (currentProfile && getLives(currentProfile) <= 0) {
    showNoLives();
    return;
  }

  state.op = op;
  state.grade = grade;
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

// ----- Обраний клас (зберігається в профілі) -----
let currentOp = 'add';
let currentGrade = 1;

function getSelectedGrade() {
  if (currentProfile && currentProfile.selectedGrade) return currentProfile.selectedGrade;
  return 1;
}

function setSelectedGrade(grade) {
  currentGrade = grade;
  if (currentProfile) {
    currentProfile.selectedGrade = grade;
    updateProfile(currentProfile);
  }
}

// Іконки операцій для карток
const OP_ICONS = { add: '➕', sub: '➖', mul: '✖️', div: '➗', order: '🧮', frac: '½' };

// ----- Головне меню: динамічні картки операцій за класом -----
const menuGridEl = document.getElementById('menu-grid');
const gradeSelectorEl = document.getElementById('grade-selector');

function renderMenuOperations() {
  currentGrade = getSelectedGrade();
  gradeSelectorEl.textContent = `${GRADES[currentGrade].name} ▾`;

  const sections = GRADES[currentGrade].sections;
  menuGridEl.innerHTML = '';
  sections.forEach(op => {
    const btn = document.createElement('button');
    btn.className = 'mode-card';
    btn.innerHTML = `
      <span class="mode-icon">${OP_ICONS[op]}</span>
      <span class="mode-label">${OP_CONFIG[op].label}</span>
    `;
    btn.addEventListener('click', () => {
      renderLevelScreen(op, currentGrade);
      showScreen('level');
    });
    menuGridEl.appendChild(btn);
  });
}

// ----- Екран вибору класу -----
const gradeListEl = document.getElementById('grade-list');

function renderGradeScreen() {
  gradeListEl.innerHTML = '';
  [1, 2, 3, 4].forEach(grade => {
    const meta = GRADES[grade];
    const btn = document.createElement('button');
    btn.className = 'level-card' + (grade === getSelectedGrade() ? ' current-grade' : '');
    btn.innerHTML = `
      <span class="level-icon">${meta.icon}</span>
      <span class="level-text">
        <span class="level-name">${meta.name}</span>
        <span class="level-hint">${meta.hint}</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      setSelectedGrade(grade);
      renderMenuOperations();
      showScreen('menu');
    });
    gradeListEl.appendChild(btn);
  });
}

// ----- Екран вибору типу завдань -----
const levelListEl = document.getElementById('level-list');
const levelOpTitleEl = document.getElementById('level-op-title');
const levelSubtitleEl = document.getElementById('level-subtitle');

function renderLevelScreen(op, grade) {
  currentOp = op;
  currentGrade = grade;
  levelOpTitleEl.textContent = OP_CONFIG[op].label;
  levelSubtitleEl.textContent = `${GRADES[grade].name} · обери рівень`;
  const unlocked = currentProfile ? getUnlockedLevel(currentProfile, op, grade) : 1;

  levelListEl.innerHTML = '';
  // Порядок дій та частини мають лише один тип завдань (прямий вираз)
  const levels = (op === 'order' || op === 'frac') ? [1] : [1, 2, 3];
  levels.forEach(level => {
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
        showToast(T.lockedLevelToast);
      } else {
        openBlock(op, grade, level);
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

function openBlock(op, grade, level) {
  currentOp = op;
  currentGrade = grade;
  currentBlockLevel = level;
  state.op = op;
  state.grade = grade;
  state.level = level;
  state.track = currentProfile ? getUnlockedTrack(currentProfile, op, grade, level) : 1;
  blockTitleEl.textContent = LEVEL_META[level].name;
  blockSubtitleEl.textContent = `${OP_CONFIG[op].label} · ${GRADES[grade].name}`;
  updateLivesBadges();
  renderBlockMap();
  showScreen('block');
}

let currentBlockLevel = 1;

function renderBlockMap() {
  const op = state.op, grade = state.grade, level = state.level;
  const unlockedTrack = currentProfile ? getUnlockedTrack(currentProfile, op, grade, level) : 1;
  const track = state.track;
  const unlockedTask = (track < unlockedTrack)
    ? TASKS_PER_BLOCK + 1  // доріжка вже повністю пройдена
    : (currentProfile ? getUnlockedTask(currentProfile, op, grade, level) : 1);

  // Індикатор доріжки та завдань
  const totalTaskNum = (track - 1) * TASKS_PER_BLOCK;
  trackIndicatorEl.textContent = T.trackIndicator(track, TRACKS_PER_TIER, totalTaskNum + Math.min(unlockedTask - 1, TASKS_PER_BLOCK), 100);

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
        showToast(T.lockedTaskToast);
        return;
      }
      startBlock(op, grade, level, track, task);
    });

    station.appendChild(dot);
    blockMapEl.appendChild(station);
  }

  // Кнопка "Далі"
  const trackDone = unlockedTask > TASKS_PER_BLOCK;
  if (trackDone && track < TRACKS_PER_TIER) {
    nextTrackBtn.style.display = 'block';
    nextTrackBtn.textContent = T.nextTrackBtn(track + 1);
    nextTrackBtn.onclick = () => { state.track = track + 1; renderBlockMap(); };
  } else if (trackDone && track >= TRACKS_PER_TIER) {
    nextTrackBtn.style.display = 'block';
    nextTrackBtn.textContent = T.moreTasksBtn;
    nextTrackBtn.onclick = () => { state.track = track + 1; renderBlockMap(); };
  } else {
    nextTrackBtn.style.display = 'none';
  }
}

// Перемикач класу на головному екрані
gradeSelectorEl.addEventListener('click', () => {
  renderGradeScreen();
  showScreen('grade');
});

document.getElementById('grade-back-btn').addEventListener('click', () => showScreen('menu'));
document.getElementById('level-back-btn').addEventListener('click', () => showScreen('menu'));
document.getElementById('block-back-btn').addEventListener('click', () => {
  renderLevelScreen(currentOp, currentGrade);
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
      ${isActive ? `<span class="shop-item-status">${T.shopChosen}</span>` :
        isOwned ? `<span class="shop-item-status">${T.shopChoose}</span>` :
        `<span class="shop-item-price">⭐ ${skin.price}</span>`}
    `;
    btn.addEventListener('click', () => {
      if (isActive) return;
      if (!isOwned && !canAfford) {
        showToast(T.needMoreStars(skin.price - getStars(currentProfile)));
        return;
      }
      buySkin(currentProfile, skin.id);
      soundPurchase();
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

// ----- Екран досягнень -----
const badgesGridEl = document.getElementById('badges-grid');
const badgesCountEl = document.getElementById('badges-count');

function renderBadges() {
  if (!currentProfile) return;
  const owned = getBadges(currentProfile);
  badgesCountEl.textContent = T.badgesCount(owned.length, BADGES.length);

  badgesGridEl.innerHTML = '';
  BADGES.forEach(badge => {
    const isOwned = owned.includes(badge.id);
    const card = document.createElement('div');
    card.className = 'badge-card' + (isOwned ? '' : ' locked');
    card.innerHTML = `
      <span class="badge-icon">${isOwned ? badge.icon : '🔒'}</span>
      <span class="badge-name">${badge.name}</span>
      <span class="badge-desc">${badge.desc}</span>
    `;
    badgesGridEl.appendChild(card);
  });
}

document.getElementById('open-badges-btn').addEventListener('click', () => {
  renderBadges();
  showScreen('badges');
});

document.getElementById('badges-back-btn').addEventListener('click', () => showScreen('menu'));

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
    leadersListEl.innerHTML = `<p class="leaders-empty">${T.leadersEmpty}</p>`;
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
  const text = T.livesLeftText(lives);
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
    livesModalTimer.textContent = T.livesModalFull;
  } else {
    livesModalTimer.textContent = T.nextLifeIn(formatMs(msToNextLife(currentProfile)));
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
    noLivesText.textContent = T.nextLifeInNow(formatMs(msToNextLife(currentProfile)));
  }
  showScreen('nolives');
}

// Тимчасово: кнопка реклами одразу дає +5 (місце під реальну рекламу)
document.getElementById('watch-ad-btn').addEventListener('click', () => {
  if (currentProfile) {
    refillLives(currentProfile);
    updateLivesBadges();
  }
  showToast(T.livesRestored);
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
  greetingEl.textContent = T.greeting(profile.name);
  updateStarBalance();
  updateLivesBadges();
  renderMenuOperations();
  updateDailyGoal();
  showScreen('menu');
}

function updateStarBalance() {
  if (!currentProfile) return;
  starBalanceEl.textContent = T.starsBalance(getStars(currentProfile));
  rankLabelEl.textContent = T.rank(getRank(currentProfile));
  streakLabelEl.textContent = T.streakLabel(getStreak(currentProfile));
}

const dailyGoalEl = document.getElementById('daily-goal');
const dailyGoalTextEl = document.getElementById('daily-goal-text');
const dailyGoalRingEl = document.getElementById('daily-goal-ring');

function updateDailyGoal() {
  if (!currentProfile) return;
  const done = getDailyProgress(currentProfile);
  dailyGoalTextEl.textContent = T.dailyGoalText(Math.min(done, DAILY_GOAL), DAILY_GOAL);
  if (isDailyGoalDone(currentProfile)) {
    dailyGoalEl.classList.add('done');
    dailyGoalRingEl.textContent = '✅';
  } else {
    dailyGoalEl.classList.remove('done');
    dailyGoalRingEl.textContent = '🎯';
  }
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

// ----- Перемикач звуку -----
const soundToggleEl = document.getElementById('sound-toggle');

function updateSoundToggle() {
  soundToggleEl.textContent = isSoundOn() ? '🔊' : '🔇';
}

soundToggleEl.addEventListener('click', () => {
  setSoundOn(!isSoundOn());
  updateSoundToggle();
  if (isSoundOn()) soundCorrect();
});

updateSoundToggle();

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

