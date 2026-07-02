// ===== Генератор завдань =====

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
