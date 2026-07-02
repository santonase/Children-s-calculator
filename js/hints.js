// ===== Підказки-пояснення після помилки =====
// Для малих чисел (сума/добуток до 20) — візуальні кружечки.
// Для більших — текстове покрокове пояснення (розклад за розрядами).

// Візуальний рядок кружечків: групи різних кольорів
function dotsRow(count, cssClass) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `<span class="hint-dot ${cssClass}"></span>`;
  }
  return html;
}

function buildHint(op, a, b, answer) {
  const small = (op === 'add' && a + b <= 20) ||
                (op === 'sub' && a <= 20) ||
                (op === 'mul' && a * b <= 20) ||
                (op === 'div' && a <= 20);

  if (op === 'add') {
    if (small) {
      return `<div class="hint-visual">${dotsRow(a, 'hint-dot-a')}${dotsRow(b, 'hint-dot-b')}</div>
        <p class="hint-text">${a} і ще ${b} — порахуй усі кружечки разом: ${answer}</p>`;
    }
    const tensA = Math.floor(a / 10) * 10, onesA = a % 10;
    if (tensA > 0 && onesA > 0) {
      return `<p class="hint-text">Розклади: ${a} = ${tensA} + ${onesA}.<br>Спочатку ${tensA} + ${b} = ${tensA + b}, потім + ${onesA} = ${answer}</p>`;
    }
    return `<p class="hint-text">Порахуй крок за кроком: ${a} + ${b} = ${answer}</p>`;
  }

  if (op === 'sub') {
    if (small) {
      return `<div class="hint-visual">${dotsRow(answer, 'hint-dot-a')}${dotsRow(b, 'hint-dot-x')}</div>
        <p class="hint-text">Було ${a}, закреслюємо ${b} — лишилось ${answer}</p>`;
    }
    return `<p class="hint-text">Перевір додаванням: ${answer} + ${b} = ${a}</p>`;
  }

  if (op === 'mul') {
    if (small) {
      let rows = '';
      for (let i = 0; i < a; i++) {
        rows += `<div class="hint-visual">${dotsRow(b, 'hint-dot-a')}</div>`;
      }
      return `${rows}<p class="hint-text">${a} ${threeWay(a, 'ряд', 'ряди', 'рядів')} по ${b} — разом ${answer}</p>`;
    }
    return `<p class="hint-text">${a} × ${b} — це ${b} додати ${a} разів: ${answer}</p>`;
  }

  if (op === 'div') {
    if (small && answer <= 10) {
      let groups = '';
      for (let i = 0; i < b; i++) {
        groups += `<div class="hint-visual hint-group">${dotsRow(answer, 'hint-dot-a')}</div>`;
      }
      return `${groups}<p class="hint-text">${a} поділили на ${b} ${threeWay(b, 'групу', 'групи', 'груп')} — у кожній по ${answer}</p>`;
    }
    return `<p class="hint-text">Перевір множенням: ${b} × ${answer} = ${a}</p>`;
  }

  return '';
}
