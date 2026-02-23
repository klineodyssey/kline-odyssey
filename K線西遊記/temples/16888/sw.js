// sw.js — 廣寒宮 16888
// 升版請改這裡（最重要）
const CACHE_NAME = 'gh-16888-v1_6_1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/fairy.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting(); // 立刻啟用新 SW
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 清掉舊版 cache
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k !== CACHE_NAME) return caches.delete(k);
    }));
    await self.clients.claim(); // 立刻接管所有頁面
  })());
});

// ✅ Network First：在線就拿最新；離線才用 cache
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只處理 GET
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      const cached = await caches.match(req);
      return cached || caches.match('./index.html');
    }
  })());
});
