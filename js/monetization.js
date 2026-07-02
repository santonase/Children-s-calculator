// ===== Монетизація (freemium) =====
// Абстракція преміум-статусу. Реальні платежі (Google Play Billing / Stripe)
// підключаються пізніше через функцію purchasePremium() — решта коду не зміниться.

const PREMIUM_KEY = 'kidsCalc.premium';

// Безкоштовна межа: скільки доріжок доступно безкоштовно в кожному типі завдань.
// Перша операція (додавання) безкоштовна повністю; решта — обмежені.
const FREE_TRACKS_LIMIT = 2;      // безкоштовно доступні доріжки 1-2 (крім повністю вільних розділів)
const FREE_OPS = ['add'];         // операції, безкоштовні повністю

function isPremium() {
  // Преміум зберігається окремо від профілю — прив'язаний до пристрою/акаунта.
  return KVStore.getRaw(PREMIUM_KEY) === 'active';
}

function setPremium(active) {
  KVStore.setRaw(PREMIUM_KEY, active ? 'active' : 'off');
}

// Чи доступний конкретний контент безкоштовно
function isContentFree(op, track) {
  if (isPremium()) return true;
  if (FREE_OPS.includes(op)) return true;      // вся операція безкоштовна
  return track <= FREE_TRACKS_LIMIT;           // інакше — лише перші N доріжок
}

// Чи заблокована доріжка через межу безкоштовної версії
function isTrackLocked(op, track) {
  return !isContentFree(op, track);
}

// ----- Платіж (заглушка до інтеграції реального білінгу) -----
// Пізніше тут буде виклик Google Play Billing (у TWA) або Stripe (у веб).
// Наразі — проміс, який імітує успішну «покупку» для тестування UI-потоку.
function purchasePremium() {
  return new Promise((resolve) => {
    // TODO: інтеграція реального білінгу.
    // Google Play Billing: window.PaymentRequest / Digital Goods API у TWA.
    // Web: Stripe Checkout / Payment Links.
    setPremium(true);
    resolve({ success: true });
  });
}

function restorePurchases() {
  // TODO: перевірка активної підписки через білінг.
  return Promise.resolve({ premium: isPremium() });
}
