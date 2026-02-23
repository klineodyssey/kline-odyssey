// sw-kill.js  — remove service worker + caches (one-time)
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    }
    if (window.caches) {
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    }
    console.log("[SW-KILL] done");
  } catch (e) {
    console.log("[SW-KILL] error", e);
  }
})();
