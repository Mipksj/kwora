/* Kwora SW — минимальный, чтобы приложение считалось PWA.
   Стратегия: СЕТЬ ПРЕЖДЕ ВСЕГО. Кэш используется только как запасной
   вариант при полном отсутствии сети. Обновления сайта подтягиваются сразу. */

const CACHE = "kwora-fallback-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // не трогаем чужие домены (Firebase, шрифты и т.д.) — пусть идут напрямую
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // свежий ответ кладём в запасной кэш
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)) // офлайн — отдаём последнее сохранённое
  );
});
