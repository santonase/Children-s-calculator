// ===== Сховище: профілі, лідери, міграції схеми =====
// Абстракція над localStorage. Для майбутньої хмарної синхронізації
// достатньо замінити реалізацію KVStore, не чіпаючи решту коду.

const KVStore = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getRaw(key) { return localStorage.getItem(key); },
  setRaw(key, value) { localStorage.setItem(key, value); },
};

// ----- Версія схеми профілю та міграції -----
const PROFILE_SCHEMA_VERSION = 6;

function migrateProfile(p) {
  if (!p) return p;
  const v = p.schemaVersion || 1;
  // v1 -> v2: зірки, скіни, стрик, життя (могли бути відсутні у найстаріших профілів)
  if (v < 2) {
    if (p.stars === undefined) p.stars = 0;
    if (p.totalStarsEarned === undefined) p.totalStarsEarned = p.stars || 0;
    if (!p.ownedSkins) p.ownedSkins = ['rocket-classic'];
    if (!p.activeSkin) p.activeSkin = 'rocket-classic';
    if (p.streak === undefined) p.streak = 0;
    if (p.lastPlayedDate === undefined) p.lastPlayedDate = null;
    if (!p.claimedStreakBonuses) p.claimedStreakBonuses = [];
    if (p.lives === undefined) p.lives = MAX_LIVES;
    if (p.livesUpdatedAt === undefined) p.livesUpdatedAt = Date.now();
  }
  // v2 -> v3: вікові рівні (typeProgress/blockProgress з ключами op-tier-level)
  if (v < 3) {
    if (!p.typeProgress) p.typeProgress = {};
    if (!p.blockProgress) p.blockProgress = {};
  }
  // v3 -> v4: перехід на класи НУШ (обраний клас за замовчуванням 1)
  if (v < 4) {
    if (!p.selectedGrade) p.selectedGrade = 1;
  }
  // v4 -> v5: досягнення, щоденні цілі, сундуки
  if (v < 5) {
    if (!p.badges) p.badges = [];
    if (p.tracksToChest === undefined) p.tracksToChest = 0;
    if (p.perfectTracks === undefined) p.perfectTracks = 0;
    if (!p.dailyGoal) p.dailyGoal = null;
  }
  // v5 -> v6: батьківська статистика
  if (v < 6) {
    if (!p.stats) p.stats = { byOp: {}, byDay: {}, totalSeconds: 0, totalTasks: 0 };
  }
  p.schemaVersion = PROFILE_SCHEMA_VERSION;
  return p;
}

function loadProfiles() {
  try {
    const raw = KVStore.getRaw(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.map(migrateProfile);
  } catch (e) {
    return [];
  }
}

function saveProfiles(profiles) {
  KVStore.setRaw(STORAGE_KEY, JSON.stringify(profiles));
}

function getActiveProfile() {
  const id = KVStore.getRaw(ACTIVE_KEY);
  if (!id) return null;
  return loadProfiles().find(p => p.id === id) || null;
}

function setActiveProfile(id) {
  KVStore.setRaw(ACTIVE_KEY, id);
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
    blockProgress: {}, // ключ "op-grade-level" -> { unlockedTrack, unlockedTask, completed }
    selectedGrade: 1,
    badges: [],
    tracksToChest: 0,
    perfectTracks: 0,
    dailyGoal: null,
    stats: { byOp: {}, byDay: {}, totalSeconds: 0, totalTasks: 0 },
    schemaVersion: PROFILE_SCHEMA_VERSION,
  };
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfile(profile.id);
  return profile;
}

function updateProfile(profile) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx > -1) {
    profiles[idx] = profile;
    saveProfiles(profiles);
  }
}

// ----- Лідери: збереження -----
function loadLeaderboard() {
  try {
    const raw = KVStore.getRaw(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLeaderboard(board) {
  KVStore.setRaw(LEADERBOARD_KEY, JSON.stringify(board));
}
