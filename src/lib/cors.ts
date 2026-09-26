// lib/cors.ts
// Cross-origin access for the native app only.
//
// The web app is same-origin with its API and needs no CORS at all. The Android
// app is served by Capacitor from `https://localhost` inside the WebView, so its
// calls to the hosted /api/* routes are cross-origin and must be allowed
// explicitly. The allowlist is fixed rather than reflective: the API accepts
// credentials-free bearer requests, so echoing an arbitrary Origin back would
// widen access for no benefit.

/** Origins the Capacitor WebView can present, per platform. */
const NATIVE_ORIGINS = [
  "https://localhost", // Android (default androidScheme: https)
  "capacitor://localhost", // iOS
  "http://localhost", // Android with cleartext scheme, dev only
];

/** Extra origins for local development against `next dev`. */
const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (NATIVE_ORIGINS.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && DEV_ORIGINS.includes(origin);
}

/**
 * CORS headers for an allowed cross-origin caller. `Allow-Credentials` is
 * deliberately absent — the native app authenticates with a bearer token and
 * sends no cookies, so permitting credentials would only add risk.
 */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    // The response varies by Origin, so caches must not serve one origin's
    // response to another.
    Vary: "Origin",
  };
}
