// Service worker — minimal: caches nothing, just enables notifications &
// allows the page to be installed as a PWA.
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow("/");
  }));
});
