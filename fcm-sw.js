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
    self.registration.showNotification(d.title || "Kwora", {
      body: d.body || "", icon: "./icon-192.png", badge: "./icon-192.png",
      data: { url: d.url || "./" }
    });
  });
} catch (e) {}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if ("focus" in w) return w.focus(); }
    return clients.openWindow(url);
  }));
});
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
