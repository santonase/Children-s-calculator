// Service Worker: кешування для офлайн-роботи "Дитячого калькулятора"

const CACHE_NAME = 'kids-calc-v9';
const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './js/config.js',
  './js/i18n/i18n.js',
  './js/i18n/uk.js',
  './js/i18n/en.js',
  './js/storage.js',
  './js/logic.js',
  './js/generator.js',
  './js/sound.js',
  './js/hints.js',
  './js/badges.js',
  './js/stats.js',
  './js/monetization.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Google Fonts та інші зовнішні запити - завжди з мережі (не кешуємо)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Стратегія "спочатку мережа": завжди намагаємось взяти свіжу версію,
  // кеш використовуємо тільки як запасний варіант (офлайн).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
