/**
 * List-It Web Service Worker
 *
 * IMPORTANT:
 *
 * Do not cache Next.js HTML/navigation responses.
 *
 * A cached Next.js page can reference JavaScript chunks from an
 * older deployment/build. That can make the browser appear to be
 * running old React code even after the source has changed.
 *
 * We only keep genuinely static PWA assets in this cache.
 */

const CACHE_NAME = "list-it-static-v2";

const STATIC_ASSETS = [
  "/manifest.json",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
];

// ------------------------------------------------------------
// Install
// ------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ------------------------------------------------------------
// Activate
// ------------------------------------------------------------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ------------------------------------------------------------
// Fetch
// ------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /**
   * Never interfere with another origin.
   */
  if (url.origin !== self.location.origin) {
    return;
  }

  /**
   * Never service-worker-cache API requests.
   */
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  /**
   * Never intercept Next.js generated assets/chunks.
   *
   * Next already fingerprints these files. The browser's normal
   * HTTP cache is the correct cache for them.
   */
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  /**
   * Navigation/document requests must always go to the network.
   *
   * This is the important fix.
   *
   * We do NOT put these responses into CACHE_NAME because an old
   * HTML document may contain references to an old Next.js build.
   */
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          `
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1"
                />
                <title>List-It</title>
              </head>

              <body
                style="
                  margin:0;
                  min-height:100vh;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:#0f172a;
                  color:#f8fafc;
                  font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                "
              >
                <main
                  style="
                    width:min(420px,calc(100% - 40px));
                    text-align:center;
                  "
                >
                  <h1 style="margin:0 0 10px;font-size:24px;">
                    You're offline
                  </h1>

                  <p
                    style="
                      margin:0;
                      color:#cbd5e1;
                      line-height:1.6;
                    "
                  >
                    Reconnect to the internet and reopen List-It.
                  </p>
                </main>
              </body>
            </html>
          `,
          {
            status: 503,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          }
        );
      })
    );

    return;
  }

  /**
   * Only explicitly-listed static PWA assets use cache-first.
   */
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname);

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse.ok) {
          return networkResponse;
        }

        const copy = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, copy);
        });

        return networkResponse;
      });
    })
  );
});