// app/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // 1️⃣ Extract query parameters via Next.js App Router's NextRequest
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type"); // "email", "recovery", or undefined
  const tokenHash = searchParams.get("token_hash"); // for both email‐confirm and recovery OTP
  const code = searchParams.get("code"); // OAuth authorization code

  // 2️⃣ Determine the base URL for your redirects
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://list-it-dom.netlify.app" // ← CHANGE 1: Fixed your domain
      : "http://localhost:3000");

  // 3️⃣ Initialize the Supabase helper, bound to this request's cookies
  const cookieStore = cookies(); // ← CHANGE 2: Fixed Next.js 15+ issue
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // —— 4️⃣ Handle signup email confirmation ——
  // URL: /auth/callback?type=email&token_hash=…
  if (type === "email" && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });

    if (error) {
      console.error("Email verification failed:", error);
      // ← CHANGE 3: Redirect to verification page with error
      return NextResponse.redirect(
        new URL(
          `/verification?status=error&message=${encodeURIComponent(error.message)}`,
          siteUrl
        )
      );
    }

    // ← CHANGE 4: Redirect to verification page with success
    return NextResponse.redirect(
      new URL("/verification?status=success", siteUrl)
    );
  }

  // —— 5️⃣ Handle password recovery (reset link) —— [UNCHANGED]
  // URL: /auth/callback?type=recovery&token_hash=…
  if (type === "recovery" && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });

    if (error) {
      console.error("Password recovery verification failed:", error);
      // Redirect to login with the error details
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, siteUrl)
      );
    }

    // On success, a temporary recovery session is active → send user to reset form
    return NextResponse.redirect(new URL("/resetPassword", siteUrl));
  }

  // —— 6️⃣ Handle OAuth callback —— [UNCHANGED]
  // URL: /auth/callback?code=… (e.g. Google sign-in)
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      if (data.session) {
        // Optional: upsert a row in your "users" table
        try {
          const { user } = data.session;
          const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();
          if (!existing) {
            await supabase.from("users").insert({
              id: user.id,
              email: user.email ?? "",
              full_name:
                user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
            });
          }
        } catch (e) {
          console.error("Error upserting user record:", e);
        }

        // Redirect to your dashboard on successful OAuth login
        return NextResponse.redirect(new URL("/dashboard", siteUrl));
      }
    } catch (err: unknown) {
      console.error("OAuth exchange error:", err);
      // Redirect back to login with the OAuth error message
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}`, siteUrl)
      );
    }
  }

  return NextResponse.redirect(new URL("/login", siteUrl));
}
