/* Kwora FCM worker — только пуши, без кэша */
try {
  importScripts("./firebase-app-compat.js", "./firebase-messaging-compat.js");
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
      body: d.body || "", icon: "./icon-192.png", badge: "./icon-192.png",
      data: { url: d.url || "./" }
    });
  });
} catch (e) {}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const data = e.notification.data || {};
  const url = data.url || "./";
  const act = e.action;
  const wantUrl = (data.type === "call")
    ? (url + (url.indexOf("?") < 0 ? "?" : "&") + "call=" + encodeURIComponent(data.callId || "") + "&act=" + (act === "decline" ? "decline" : (act === "answer" ? "answer" : "open")))
    : url;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) {
      if ("focus" in w) {
        try { w.postMessage({ kw: "call", callId: data.callId || "", act: act || "open" }); } catch (_) {}
        return w.focus();
      }
    }
    return clients.openWindow(wantUrl);
  }));
});
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
