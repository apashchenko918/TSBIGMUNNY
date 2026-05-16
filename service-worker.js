/**
 * service-worker.js — The Turrelle Sisters Big Munny v5
 * Simple network-first with cache fallback.
 * Does NOT intercept requests aggressively — lets browsers load normally.
 */

const CACHE_NAME  = 'turrelle-v6k3';
const CACHE_FILES = [
  './', './index.html', './style.css',
  './paytable.js', './state.js', './audio.js',
  './game.js', './bonuses.js', './ui.js', './operator.js',
  './manifest.json',
  './assets/splash_screen.jpg',
  './assets/sisters_celebrate.webp',
  './assets/sasha_solo_celebrate.webp',
  './assets/sisters_celebrate.png',
  './assets/sasha_solo_celebrate.png',
  './assets/TSistsersBigMunnyTitle.png',
  './assets/sisters_title.png',
  './assets/symbols/diamond.svg',
  './assets/josie.png',
  './assets/sasha.png',
  './assets/scott.png',
  './assets/maxine.png',
  './assets/josie_title.png',
  './assets/sasha_title.png', './assets/sisters.png',
  './assets/audio/ring1.mp3',
  './assets/audio/theme_music.mp3',
  './assets/audio/red_spin_music.mp3',
  './assets/audio/pick_music.mp3',
  './assets/audio/hold_spin_trigger.wav',
  './assets/audio/hold_spin_end.mp3',
  './assets/audio/credits_addup.wav',
  './assets/audio/pick_reveal.wav',
  './assets/audio/splash_welcome.wav',
  './assets/audio/lipstick_bonus.mp3',
  './assets/audio/ching.mp3',
  './assets/audio/splash_music.mp3',
  './assets/symbols/seven.svg', './assets/symbols/cherry.svg',
  './assets/symbols/lipstick.svg', './assets/symbols/gold_coin.svg',
  './assets/symbols/single_bar.svg', './assets/symbols/double_bar.svg',
  './assets/symbols/triple_bar.svg',
  './assets/symbols/letter_b.svg',
  './assets/symbols/letter_o.svg',
  './assets/symbols/letter_n.svg',
  './assets/symbols/letter_u.svg',
  './assets/symbols/letter_s.svg',
  './cashout.js',
  './assets/icons/icon-192x192.png', './assets/icons/icon-512x512.png',
  './assets/icons/apple-touch-icon.png',
];

// Install — cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install error:', err))
  );
});

// Activate — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — NETWORK FIRST, cache as fallback
// This ensures browsers always get fresh files when online
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then(networkResponse => {
        // Cache the fresh response
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});
