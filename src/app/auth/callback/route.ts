// Fixed route.ts for auth/callback
// app/auth/callback/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  // Hard-coded production URL
  const siteUrl = "https://list-it-dom.netlify.app";

  // Handle errors
  if (error) {
    console.error("Auth callback error:", error);
    // Redirect to login with error
    return NextResponse.redirect(new URL(`/login?error=${error}`, siteUrl));
  }

  // Process authentication code
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth exchange error:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_callback_error", siteUrl)
        );
      }

      if (data.session) {
        const { user } = data.session;

        try {
          // Check if user exists in users table
          const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select()
            .eq("id", user.id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking for existing user:", checkError);
          }

          if (!existingUser) {
            // Only create a new user record if one doesn't exist
            const userData = {
              id: user.id,
              email: user.email || "",
              full_name: user.user_metadata?.full_name || "",
            };

            const { error: insertError } = await supabase
              .from("users")
              .insert([userData]);

            if (insertError) {
              console.error("Error inserting user data:", insertError);
            }
          }
        } catch (err) {
          console.error("Error processing user data:", err);
          // Continue with the redirect even if there was an error creating the user
          // since the authentication was successful
        }

        // Always redirect to dashboard on success
        return NextResponse.redirect(new URL("/dashboard", siteUrl));
      }
    } catch (err) {
      console.error("Unexpected error in auth callback:", err);
      return NextResponse.redirect(
        new URL("/login?error=unexpected_error", siteUrl)
      );
    }
  }

  // Default fallback if code is missing
  return NextResponse.redirect(new URL("/login?error=missing_code", siteUrl));
}
