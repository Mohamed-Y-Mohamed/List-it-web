// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const response = NextResponse.next();

  // Create the Supabase middleware client
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Get the session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the current path
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/completed",
    "/notcomplete",
    "/priority",
    "/today",
    "/List",
    "/profile",
    "/settings",
  ];

  // Define auth routes
  const authRoutes = ["/login", "/signup", "/reset-password"];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access an auth route with an active session, redirect to dashboard
  if (isAuthRoute && session) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  // For all other routes, set auth cookies for client-side use
  if (session) {
    // Set cookies with the session token and login status
    response.cookies.set("auth_token", session.access_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
      httpOnly: false, // Allow JavaScript access for client-side auth context
    });
    response.cookies.set("isLoggedIn", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
      httpOnly: false, // Allow JavaScript access for client-side auth context
    });
  } else {
    // If no session, ensure auth cookies are cleared
    response.cookies.set("auth_token", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    response.cookies.set("isLoggedIn", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};
