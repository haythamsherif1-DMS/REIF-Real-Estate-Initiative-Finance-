/* Service worker — بيحفظ شاشة البداية والأيقونات فقط.
   النظام نفسه (script.google.com) دايمًا بيتحمّل من النت ومش بيتخزن. */
const CACHE = 'omniyat-dms-v1';
const SHELL = [
  './', 'index.html', 'manifest.json', 'logo.svg', 'favicon.svg', 'favicon-64.png',
  'icon.png', 'icon-192.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Google وأي موقع خارجي: من غير تدخل

  // الصفحة الرئيسية: من النت أولًا (علشان أي تحديث يظهر فورًا)، ولو مفيش نت من الكاش
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // الأيقونات والملفات الثابتة: من الكاش أولًا مع تحديث في الخلفية
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
