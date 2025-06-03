import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const response = NextResponse.next();

  // Get the current path and query parameters
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/completed",
    "/notcomplete",
    "/priority",
    "/today",
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
    // Clear any auth cookies when explicitly logging out
    response.cookies.set("auth_token", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set("isLoggedIn", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: false,
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
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route (login/signup/etc)
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Only create Supabase client for protected routes or auth routes (for login status)
  if (isProtectedRoute || isAuthRoute) {
    // Create the Supabase middleware client
    const supabase = createMiddlewareClient({ req: request, res: response });

    try {
      // Get the current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error in middleware:", error);

        // Clear auth cookies on error
        response.cookies.set("auth_token", "", {
          path: "/",
          maxAge: 0,
          sameSite: "lax",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
        });

        response.cookies.set("isLoggedIn", "", {
          path: "/",
          maxAge: 0,
          sameSite: "lax",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
        });

        // If on protected route, redirect to login
        if (isProtectedRoute) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/login";
          return NextResponse.redirect(loginUrl);
        }

        return response;
      }

      // Handle protected routes without session
      if (isProtectedRoute && !session) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        return NextResponse.redirect(loginUrl);
      }

      // Handle auth routes with active session
      // Only redirect away from login page if coming from another page
      // This lets users explicitly visit login if they want to login as different user
      if (isAuthRoute && session) {
        const referer = request.headers.get("referer");
        if (referer && !referer.includes(pathname)) {
          const dashboardUrl = request.nextUrl.clone();
          dashboardUrl.pathname = "/dashboard";
          return NextResponse.redirect(dashboardUrl);
        }
      }

      // Set auth cookies only for protected routes
      if (session && isProtectedRoute) {
        const cookieExpiry = 60 * 60 * 24 * 7; // 1 week

        response.cookies.set("auth_token", session.access_token, {
          path: "/",
          maxAge: cookieExpiry,
          sameSite: "lax",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
        });

        response.cookies.set("isLoggedIn", "true", {
          path: "/",
          maxAge: cookieExpiry,
          sameSite: "lax",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
        });
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
