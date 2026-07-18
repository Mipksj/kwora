/* Kwora SW v2: firebase-файлы — из кэша мгновенно, остальное — сеть прежде всего */
const CACHE = "kwora-v2";
const FB = ["firebase-app.js","firebase-auth.js","firebase-firestore.js","firebase-functions.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FB).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isFB = FB.some(f => url.pathname.endsWith("/" + f));
  if (isFB) {
    // cache-first: мгновенно из запаса, в фоне обновляем
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); return res;
  }).catch(() => caches.match(req)));
});
