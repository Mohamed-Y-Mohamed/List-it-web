// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")?.value;
  const isLoggedIn = !!authToken;
  const response = NextResponse.next();

  response.headers.set(
    "x-auth-state",
    isLoggedIn ? "authenticated" : "unauthenticated"
  );

  response.cookies.set("isLoggedIn", isLoggedIn ? "true" : "false", {
    httpOnly: false,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  // Protected routes check
  const isSecurePath =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/list");

  if (isSecurePath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
