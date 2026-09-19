const CACHE_NAME = 'math-v1';
const ASSETS = [
    '/',
    'img/icon.png',
    'index.html',
    'keypad.js',
    'main.js',
    'manifest.json',
    'math10.html',
    'math10.js',
    'math20.html',
    'math20.js',
    'math50.html',
    'math50.js',
    'scratchpad.js',
    'style.css',
    'sw.js',
    'tts.js',
    'update-checker.js',
    'uitemplate.js',
    'version.json'
    // 如果你有单独的 css 或 js，也写在这里
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});