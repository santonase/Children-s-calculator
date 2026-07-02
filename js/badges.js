// ===== Бейджі-досягнення =====
// Кожен бейдж має умову-функцію, що перевіряє стан профілю після раунду.
// Розблоковані бейджі зберігаються у profile.badges (масив id).

const BADGES = [
  { id: 'first-track', icon: '🎯', name: 'Перший крок', desc: 'Пройди першу доріжку' },
  { id: 'hundred', icon: '💯', name: 'Ціла сотня', desc: 'Пройди 100 завдань' },
  { id: 'perfect5', icon: '⭐', name: 'Бездоганність', desc: 'Пройди 5 доріжок без помилок' },
  { id: 'streak3', icon: '🔥', name: 'Три дні поспіль', desc: 'Грай 3 дні підряд' },
  { id: 'streak7', icon: '🌟', name: 'Тиждень поспіль', desc: 'Грай 7 днів підряд' },
  { id: 'streak30', icon: '👑', name: 'Місяць поспіль', desc: 'Грай 30 днів підряд' },
  { id: 'add-master', icon: '➕', name: 'Майстер додавання', desc: 'Відкрий усі рівні додавання' },
  { id: 'sub-master', icon: '➖', name: 'Майстер віднімання', desc: 'Відкрий усі рівні віднімання' },
  { id: 'mul-master', icon: '✖️', name: 'Майстер множення', desc: 'Відкрий усі рівні множення' },
  { id: 'div-master', icon: '➗', name: 'Майстер ділення', desc: 'Відкрий усі рівні ділення' },
  { id: 'shopper', icon: '🛒', name: 'Модник', desc: 'Купи першу нову ракету' },
  { id: 'collector', icon: '🚀', name: 'Колекціонер', desc: 'Збери всі ракети' },
  { id: 'star50', icon: '✨', name: 'Зіркар', desc: 'Назбирай 50 зірок' },
  { id: 'star200', icon: '🌠', name: 'Зоряний магнат', desc: 'Назбирай 200 зірок' },
];

function getBadges(profile) {
  return profile.badges || [];
}

function hasBadge(profile, id) {
  return getBadges(profile).includes(id);
}

// Загальна кількість пройдених завдань (сума по всіх блоках)
function totalTasksDone(profile) {
  if (!profile.blockProgress) return 0;
  let total = 0;
  for (const key in profile.blockProgress) {
    const bp = profile.blockProgress[key];
    const tracks = (bp.unlockedTrack || 1) - 1; // повністю пройдені доріжки
    total += tracks * 10 + Math.max(0, (bp.unlockedTask || 1) - 1);
  }
  return total;
}

// Чи відкриті всі рівні операції хоча б в одному класі
function isOpMastered(profile, op) {
  if (!profile.typeProgress) return false;
  for (const key in profile.typeProgress) {
    if (key.startsWith(op + '-') && profile.typeProgress[key].unlockedLevel >= 3) {
      return true;
    }
  }
  return false;
}

// Перевіряє всі умови, повертає масив нових розблокованих бейджів
function checkBadges(profile) {
  if (!profile.badges) profile.badges = [];
  const newly = [];

  const conditions = {
    'first-track': () => totalTasksDone(profile) >= 10,
    'hundred': () => totalTasksDone(profile) >= 100,
    'perfect5': () => (profile.perfectTracks || 0) >= 5,
    'streak3': () => (profile.streak || 0) >= 3,
    'streak7': () => (profile.streak || 0) >= 7,
    'streak30': () => (profile.streak || 0) >= 30,
    'add-master': () => isOpMastered(profile, 'add'),
    'sub-master': () => isOpMastered(profile, 'sub'),
    'mul-master': () => isOpMastered(profile, 'mul'),
    'div-master': () => isOpMastered(profile, 'div'),
    'shopper': () => getOwnedSkins(profile).length >= 2,
    'collector': () => getOwnedSkins(profile).length >= SKINS.length,
    'star50': () => (profile.totalStarsEarned || 0) >= 50,
    'star200': () => (profile.totalStarsEarned || 0) >= 200,
  };

  for (const badge of BADGES) {
    if (!hasBadge(profile, badge.id) && conditions[badge.id] && conditions[badge.id]()) {
      profile.badges.push(badge.id);
      newly.push(badge);
    }
  }

  if (newly.length > 0) updateProfile(profile);
  return newly;
}
