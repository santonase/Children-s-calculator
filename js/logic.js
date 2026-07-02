// ===== Доменна логіка: зірки, ранги, стрик, життя, прогрес =====

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
