// app/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

type Metadata = {
  full_name?: string;
  name?: string;
};

export async function GET(request: NextRequest) {
  // 1️⃣ Extract query parameters via Next.js App Router's NextRequest
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type"); // "email", "recovery", or undefined
  const tokenHash = searchParams.get("token_hash"); // for email‐confirm & recovery OTP
  const code = searchParams.get("code"); // OAuth authorization code
  const accessToken = searchParams.get("access_token"); // Mobile flow access token
  const refreshToken = searchParams.get("refresh_token"); // Mobile flow refresh token

  // 2️⃣ Base URL for redirects
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://list-it-dom.netlify.app"
      : "http://localhost:3000");

  // 🔧 Remove double slashes
  const fixDoubleSlashes = (url: string): string =>
    url.replace(/([^:]\/)\/+/g, "$1");

  // 3️⃣ Initialize Supabase helper bound to this request's cookies
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });

  // —— 4️⃣ Handle signup email confirmation ——
  if (type === "email" && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (error) {
      const errorUrl = `${siteUrl}/verification?status=error&message=${encodeURIComponent(
        error.message
      )}`;
      return NextResponse.redirect(new URL(fixDoubleSlashes(errorUrl)));
    }
    return NextResponse.redirect(
      new URL(fixDoubleSlashes(`${siteUrl}/verification?status=success`))
    );
  }

  // —— 5️⃣ Handle password recovery ——
  if (type === "recovery" && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, siteUrl)
      );
    }
    return NextResponse.redirect(new URL("/resetPassword", siteUrl));
  }

  // —— 6️⃣ Handle Mobile OAuth Success (with tokens) ——
  if (accessToken && refreshToken) {
    try {
      // Persist tokens into the Supabase session cookies
      const { data: setSessionData, error: setSessionError } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      if (setSessionError) throw setSessionError;

      const user = setSessionData.session?.user;
      if (user) {
        const metadata = user.user_metadata as Metadata;

        // Upsert into your users table if not already present
        const { data: existing, error: selectError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (selectError) throw selectError;

        if (!existing) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            full_name: metadata.full_name ?? metadata.name ?? "",
          });
        }
      }
    } catch (err) {
      console.error("Error upserting mobile OAuth user:", err);
      // we continue into the app flow even on error
    }

    // Deep-link back into the iOS app
    const mobileCallbackUrl = `listit://auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
    return NextResponse.redirect(new URL(mobileCallbackUrl));
  }

  // —— 7️⃣ Handle OAuth callback (Web) ——
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      if (data.session) {
        const { user } = data.session;
        const metadata = user.user_metadata as Metadata;

        // Upsert into your users table if not already present
        const { data: existing, error: selectError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();
        // PGRST116 = “no rows returned”; ignore that one
        if (selectError && selectError.code !== "PGRST116") throw selectError;

        if (!existing) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            full_name: metadata.full_name ?? metadata.name ?? "",
          });
        }
      }

      return NextResponse.redirect(new URL("/dashboard", siteUrl));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(msg)}`, siteUrl)
      );
    }
  }

  // Fallback: send back to login
  return NextResponse.redirect(new URL("/login", siteUrl));
}
