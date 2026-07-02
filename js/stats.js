// ===== Батьківська статистика =====
// Локально накопичує дані про заняття: активність за днями, точність
// по кожній операції, час. Дані зберігаються в profile.stats.

function ensureStats(profile) {
  if (!profile.stats) {
    profile.stats = {
      byOp: {},      // op -> { correct, wrong }
      byDay: {},     // 'YYYY-M-D' -> { tasks, seconds }
      totalSeconds: 0,
      totalTasks: 0,
    };
  }
  return profile.stats;
}

// Реєструє одну відповідь (правильну чи ні) по операції
function statRegisterAnswer(profile, op, isCorrect) {
  const s = ensureStats(profile);
  if (!s.byOp[op]) s.byOp[op] = { correct: 0, wrong: 0 };
  if (isCorrect) s.byOp[op].correct += 1;
  else s.byOp[op].wrong += 1;
  // updateProfile викликається рідше (наприкінці доріжки), тут лише мутуємо
}

// Реєструє завершення доріжки: додає час і завдання за сьогодні
function statRegisterTrack(profile, seconds, tasks) {
  const s = ensureStats(profile);
  const day = dateKey(Date.now());
  if (!s.byDay[day]) s.byDay[day] = { tasks: 0, seconds: 0 };
  s.byDay[day].tasks += tasks;
  s.byDay[day].seconds += seconds;
  s.totalSeconds += seconds;
  s.totalTasks += tasks;
  updateProfile(profile);
}

// Точність по операції у відсотках (або null, якщо ще не грав)
function statAccuracy(profile, op) {
  const s = ensureStats(profile);
  const o = s.byOp[op];
  if (!o || (o.correct + o.wrong) === 0) return null;
  return Math.round((o.correct / (o.correct + o.wrong)) * 100);
}

// Найслабша операція (найнижча точність серед зіграних)
function statWeakestOp(profile) {
  const s = ensureStats(profile);
  let weakest = null, lowest = 101;
  for (const op in s.byOp) {
    const acc = statAccuracy(profile, op);
    if (acc !== null && acc < lowest) { lowest = acc; weakest = op; }
  }
  return weakest ? { op: weakest, accuracy: lowest } : null;
}

// Активність за останні 7 днів: масив { day, tasks }
function statLast7Days(profile) {
  const s = ensureStats(profile);
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    result.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      tasks: (s.byDay[key] && s.byDay[key].tasks) || 0,
    });
  }
  return result;
}

// Загальний час занять у форматі "Xг Yхв" / "Yхв"
function statTotalTime(profile) {
  const s = ensureStats(profile);
  const totalMin = Math.round(s.totalSeconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { hours: h, minutes: m, totalMinutes: totalMin };
}
