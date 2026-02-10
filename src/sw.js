const CACHE_NAME = 'math-v1';
const ASSETS = [
    '/',
    'index.html',
    'math20.html',
    'mainfest.json',
    'img/icon.png'
    // 如果你有单独的 css 或 js，也写在这里
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});