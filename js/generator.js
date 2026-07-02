// ===== Генератор завдань =====

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(op, grade) {
  grade = grade || 1;
  const r = (GRADES[grade] && GRADES[grade].ranges[op]) || {};
  let a, b, answer;

  if (op === 'add') {
    for (let attempt = 0; attempt < 50; attempt++) {
      a = randInt(1, r.maxTerm);
      b = randInt(1, r.maxTerm);
      answer = a + b;
      if (answer > r.maxSum) continue;
      if (!r.carry && (a % 10) + (b % 10) > 10) continue;
      break;
    }
  } else if (op === 'sub') {
    a = randInt(2, r.maxTerm);
    b = randInt(1, a);
    answer = a - b;
  } else if (op === 'mul') {
    for (let attempt = 0; attempt < 50; attempt++) {
      if (r.extra && Math.random() < 0.4) {
        // Позатабличне множення: двоцифрове на одноцифрове (24 × 3)
        a = randInt(11, 40);
        b = randInt(2, 9);
      } else {
        a = randInt(1, r.maxFactor);
        b = randInt(1, r.maxFactor);
      }
      answer = a * b;
      if (r.maxProduct && answer > r.maxProduct && !r.extra) continue;
      break;
    }
  } else if (op === 'div') {
    for (let attempt = 0; attempt < 50; attempt++) {
      if (r.extra && Math.random() < 0.4) {
        answer = randInt(11, 40);
        b = randInt(2, 9);
      } else {
        b = randInt(1, r.maxFactor);
        answer = randInt(1, r.maxFactor);
      }
      a = b * answer;
      if (r.maxProduct && a > r.maxProduct && !r.extra) continue;
      break;
    }
  } else if (op === 'order') {
    // Вираз у 2 дії з дужками: (a + b) × c  або  a + b × c
    const max = r.maxTerm || 20;
    const withBrackets = Math.random() < 0.5;
    const c = randInt(2, 5);
    a = randInt(1, Math.max(2, Math.floor(max / 2)));
    b = randInt(1, Math.max(2, Math.floor(max / 2)));
    if (withBrackets) {
      answer = (a + b) * c;
      return { a, b, c, answer, expr: `(${a} + ${b}) × ${c}` };
    } else {
      answer = a + b * c;
      return { a, b, c, answer, expr: `${a} + ${b} × ${c}` };
    }
  } else if (op === 'frac') {
    // Знайти частину числа: половину/третину/чверть
    const parts = [
      { div: 2, word: 'половину' },
      { div: 3, word: 'третину' },
      { div: 4, word: 'чверть' },
    ];
    const p = parts[randInt(0, parts.length - 1)];
    answer = randInt(1, Math.max(2, Math.floor((r.maxNumber || 100) / p.div)));
    a = answer * p.div;
    b = p.div;
    return { a, b, answer, expr: `Знайди ${p.word} від ${a}`, fracWord: p.word };
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
