// lib/apiFetch.ts
// `fetch` for this app's own /api/* routes. The relative path is passed straight
// through and the browser attaches the Supabase session cookie automatically.

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(path, init);
}
