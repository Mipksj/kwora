/* Kwora SW v3: запас firebase-файлов + фоновые пуш-уведомления */
const CACHE = "kwora-v3";
const FB = ["firebase-app.js","firebase-auth.js","firebase-firestore.js","firebase-functions.js",
            "firebase-messaging.js","firebase-app-compat.js","firebase-messaging-compat.js"];

try {
  importScripts("./firebase-app-compat.js", "./firebase-messaging-compat.js");
  if (self.firebase) {
    firebase.initializeApp({
      apiKey: "AIzaSyCkp9-fJ30nYnDe0H0QsUVXlUeicw6hcEM",
      authDomain: "kwora-massanger.firebaseapp.com",
      projectId: "kwora-massanger",
      storageBucket: "kwora-massanger.firebasestorage.app",
      messagingSenderId: "895244701523",
      appId: "1:895244701523:web:cdc7591dda5315ba021ba6"
    });
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((p) => {
      const d = (p && p.data) || {};
      self.registration.showNotification(d.title || "Kwora", {
        body: d.body || "",
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        data: { url: d.url || "./" }
      });
    });
  }
} catch (e) { /* fcm-файлы ещё не скачаны — пуши просто выключены */ }

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if ("focus" in w) return w.focus(); }
    return clients.openWindow(url);
  }));
});

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
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); return res;
  }).catch(() => caches.match(req)));
});
