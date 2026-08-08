/* Kwora SW v3: запас firebase-файлов + фоновые пуш-уведомления */
const CACHE = "kwora-v6";
const SHARE = "kwora-share";
const FB = ["firebase-app.js","firebase-auth.js","firebase-firestore.js","firebase-functions.js",
            "firebase-messaging.js","firebase-storage.js","firebase-app-compat.js","firebase-messaging-compat.js"];

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
      if (d.type === "call") {
        self.registration.showNotification(d.title || "Kwora", {
          body: d.body || "Входящий звонок",
          icon: "./icon-192.png", badge: "./icon-192.png",
          tag: "kwora-call", renotify: true, requireInteraction: true,
          vibrate: [600, 400, 600, 400, 600, 400, 600],
          actions: [{ action: "answer", title: "Ответить" }, { action: "decline", title: "Отклонить" }],
          data: { url: d.url || "./", type: "call", callId: d.callId || "" }
        });
        return;
      }
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
  const __d = e.notification.data || {};
  if (__d.type === "call") {
    e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
      for (const w of ws) { if ("focus" in w) { try { w.postMessage({ kw: "call", callId: __d.callId || "", act: e.action || "open" }); } catch (_) {} return w.focus(); } }
      const u = (__d.url || "./") + ((__d.url || "./").indexOf("?") < 0 ? "?" : "&") + "call=" + encodeURIComponent(__d.callId || "") + "&act=" + (e.action === "decline" ? "decline" : (e.action === "answer" ? "answer" : "open"));
      return clients.openWindow(u);
    }));
    return;
  }
  const url = __d.url || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if ("focus" in w) return w.focus(); }
    return clients.openWindow(url);
  }));
});

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FB).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== SHARE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* ---------- приём из системного «Поделиться» ---------- */
async function takeShare(req){
  try {
    const fd = await req.formData();
    const files = fd.getAll("files").filter(f => f && f.size);
    const text = [fd.get("title"), fd.get("text"), fd.get("url")]
      .filter(Boolean).map(String).join(" ").trim();
    const c = await caches.open(SHARE);
    for (const k of await c.keys()) await c.delete(k);
    const meta = { text, files: [] };
    let i = 0;
    for (const f of files.slice(0, 4)) {
      const key = "/__share/" + i++;
      await c.put(new Request(key), new Response(f, {
        headers: { "content-type": f.type || "application/octet-stream" }
      }));
      meta.files.push({ key, type: f.type || "", name: f.name || "" });
    }
    await c.put(new Request("/__share/meta"), new Response(JSON.stringify(meta), {
      headers: { "content-type": "application/json" }
    }));
  } catch (_) {}
  return Response.redirect("/?share=1", 303);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method === "POST" && new URL(req.url).pathname === "/share") {
    e.respondWith(takeShare(req));
    return;
  }
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isFB = FB.some(f => url.pathname.endsWith("/" + f));
  if (isFB) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req)));
});
