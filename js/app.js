// ===== Застосунок: стан, екрани, обробники =====

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

    feedbackEl.textContent = T.tryAgainLives('❤️'.repeat(livesLeft) || T.livesGone);
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
  const list = correct ? T.encouragementsGood : T.encouragementsSoft;
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

  resultTitle.textContent = T.trackDoneTitle;
  resultText.textContent = T.trackDoneText(TASKS_PER_BLOCK);

  unlockMessageEl.textContent = '';
  starsEarnedEl.textContent = '';
  streakMessageEl.textContent = '';

  if (currentProfile) {
    const perfect = state.blockMistakes === 0;
    const earned = perfect ? 3 : 1;
    awardStars(currentProfile, earned);
    starsEarnedEl.textContent = T.starsEarned(earned);

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
        unlockMessageEl.textContent = T.nextLevelUnlocked;
      }
    }

    const streakBonus = updateStreak(currentProfile);
    if (streakBonus) {
      streakMessageEl.textContent = T.streakBonus(streakBonus.days, streakBonus.stars);
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
  levelSubtitleEl.textContent = T.chooseLevelIn(AGE_TIERS[tier].name);
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
        showToast(T.lockedLevelToast);
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
      startBlock(op, tier, level, track, task);
    });

    station.appendChild(dot);
    blockMapEl.appendChild(station);
  }

  // Кнопка "Далі" — показуємо, якщо поточну доріжку пройдено і можна перейти на наступну
  const trackDone = unlockedTask > TASKS_PER_BLOCK;
  if (trackDone && track < TRACKS_PER_TIER) {
    nextTrackBtn.style.display = 'block';
    nextTrackBtn.textContent = T.nextTrackBtn(track + 1);
    nextTrackBtn.onclick = () => {
      state.track = track + 1;
      renderBlockMap();
    };
  } else if (trackDone && track >= TRACKS_PER_TIER) {
    // Усі 100 завдань пройдено — генеруємо ще
    nextTrackBtn.style.display = 'block';
    nextTrackBtn.textContent = T.moreTasksBtn;
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
  showScreen('menu');
}

function updateStarBalance() {
  if (!currentProfile) return;
  starBalanceEl.textContent = T.starsBalance(getStars(currentProfile));
  rankLabelEl.textContent = T.rank(getRank(currentProfile));
  streakLabelEl.textContent = T.streakLabel(getStreak(currentProfile));
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

