const CACHE_NAME = "omniroute-pwa-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-512.png",
  "/apple-touch-icon.png",
];
const EXCLUDED_PATH_PREFIXES = ["/api/", "/a2a", "/dashboard/endpoint"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      // Build identity lives in CACHE_NAME itself (stamped at build time),
      // so deleting every other cache name above already drops all stale
      // generations. No per-entry build-id comparison is needed.
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isExcludedPath = EXCLUDED_PATH_PREFIXES.some((prefix) =>
    requestUrl.pathname.startsWith(prefix)
  );
  const isNextAsset = requestUrl.pathname.startsWith("/_next/");
  const destination = event.request.destination;
  const isStaticAsset = ["style", "script", "image", "font"].includes(destination);
  const isNavigateRequest = event.request.mode === "navigate";

  // Never cache API/dashboard traffic with potentially auth-sensitive content.
  if (!isSameOrigin || isExcludedPath) {
    return;
  }

  event.respondWith(
    (async () => {
      if (isNavigateRequest) {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        } catch {
          return (await navigationFallback(event.request)) || Response.error();
        }
      }

      if (!isStaticAsset) {
        return fetch(event.request);
      }

      if (isNextAsset) {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        } catch {
          return (await caches.match(event.request)) || Response.error();
        }
      }

      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.status === 200) {
        const responseClone = networkResponse.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
      }
      return networkResponse;
    })()
  );
});

// Navigations are network-first on purpose: the dashboard is an online
// tool. When the network fails, serving a cached navigation response is
// worse than surfacing the failure -- the cached shell references
// /_next/static/<old-build-id>/ chunks that no longer exist after a
// deploy, so the page loads and then breaks on chunk 404s, and the
// broken state sticks until the cache happens to clear. An honest
// network error lets the browser show its own offline state and
// recover on the next reload. (The /offline page is still precached
// for the APP_SHELL list; it just is no longer used as a decoy.)
async function navigationFallback() {
  return Response.error();
}

// ── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "OmniRoute", body: event.data?.text() || "New notification" };
  }

  const title = data.title || "OmniRoute";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-512.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "omniroute-default",
    data: {
      url: data.url || "/dashboard",
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ───────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
