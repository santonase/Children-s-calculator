// Service Worker: кешування для офлайн-роботи "Дитячого калькулятора"

const CACHE_NAME = 'kids-calc-v2';
const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './game.js',
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
