import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { corsHeaders, isAllowedOrigin } from "@/lib/cors";

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const response = NextResponse.next();

  // Get the current path and query parameters
  const { pathname } = request.nextUrl;

  // Cross-origin access for the native app. Handled here rather than in each
  // route handler so there is a single place to reason about it. Same-origin
  // browser requests send no Origin header and fall straight through, so the
  // web app is unaffected.
  if (pathname.startsWith("/api")) {
    const origin = request.headers.get("origin");

    if (isAllowedOrigin(origin)) {
      const headers = corsHeaders(origin as string);

      // Answer the preflight here; it never needs to reach the route handler.
      if (request.method === "OPTIONS") {
        return new NextResponse(null, { status: 204, headers });
      }

      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
      return response;
    }

    // A disallowed cross-origin preflight gets no CORS headers, so the browser
    // blocks the real request. Same-origin requests continue as before.
    if (request.method === "OPTIONS" && origin) {
      return new NextResponse(null, { status: 403 });
    }
  }

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/completed",
    "/notcomplete",
    "/priority",
    "/today",
    "/recurring",
    "/stats",
    "/tomorrow",
    "/overdue",
    "/List",
    "/setting",
    "/profile",
    "/settings",
  ];

  // Define auth routes
  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  // Define routes to skip authentication checks
  const skipAuthRoutes = [
    "/auth/callback",
    "/_next",
    "/static",
    "/api",
    "/favicon.ico",
  ];

  // Check if this is a logout process by checking query parameters
  const isLoggingOut = request.nextUrl.searchParams.get("logout") === "true";
  if (isLoggingOut && pathname === "/login") {
    // Legacy cleanup. Nothing writes `auth_token` or `isLoggedIn` any more:
    // the first was a copy of the raw access token kept for a week that no
    // code ever read, and the second was never read either. The clears stay
    // so a browser still holding one from an older build is purged on logout.
    // Supabase's own session cookie is cleared by signOut, not here.
    response.cookies.set("auth_token", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set("isLoggedIn", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Return immediately for logout requests
    return response;
  }

  // Skip middleware for static files and API routes
  const shouldSkip = skipAuthRoutes.some((route) => pathname.startsWith(route));
  if (shouldSkip) {
    return response;
  }

  // Check if current path is a protected route that requires authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Check if current path is an auth route (login/signup/etc)
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Only create Supabase client for protected routes or auth routes (for login status)
  if (isProtectedRoute || isAuthRoute) {
    // The Supabase client for this request.
    //
    // Reads land on the incoming request so anything later in this middleware
    // sees a token Supabase has just refreshed; writes land on the outgoing
    // response so the browser gets it. Both halves are required — write only to
    // the response and the refresh is invisible for the rest of this pass.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    /**
     * A redirect is a fresh response, so any session cookie Supabase just
     * refreshed on `response` would be dropped on the floor and the user would
     * be bounced to /login again on the next request. Carry them across.
     */
    const redirectTo = (pathTo: string) => {
      const url = request.nextUrl.clone();
      url.pathname = pathTo;

      const redirect = NextResponse.redirect(url);
      for (const cookie of response.cookies.getAll()) {
        redirect.cookies.set(cookie);
      }
      return redirect;
    };

    try {
      // `getUser` rather than `getSession`: a session is read straight out of
      // the cookie and believed, which is no basis for deciding who may see a
      // protected route. `getUser` verifies it against the auth server.
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // No session is the normal signed-out case and arrives here as an error,
      // so only log something that is genuinely unexpected.
      if (error && error.name !== "AuthSessionMissingError") {
        console.error("Session error in middleware:", error);
      }

      // Handle protected routes without a verified user
      if (isProtectedRoute && !user) {
        return redirectTo("/login");
      }

      // Handle auth routes with active session
      // Only redirect away from login page if coming from another page
      // This lets users explicitly visit login if they want to login as different user
      if (isAuthRoute && user) {
        const referer = request.headers.get("referer");
        if (referer && !referer.includes(pathname)) {
          return redirectTo("/dashboard");
        }
      }
    } catch (error) {
      console.error("Middleware error:", error);

      // Redirect to login on error (for protected routes only)
      if (isProtectedRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
