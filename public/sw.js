// Minimal service worker — unregisters itself to avoid stale SW errors
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(self.registration.unregister());
});
