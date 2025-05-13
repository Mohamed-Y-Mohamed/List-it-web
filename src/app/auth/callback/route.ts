import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  // Get the redirectTo parameter from the URL
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth exchange error:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_callback_error", request.url)
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

        // Create the final redirect URL
        // First, decode the redirectTo parameter if it contains encoded slashes
        const decodedRedirectTo = decodeURIComponent(redirectTo);

        // Get the site URL from environment variable
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

        // Create a new URL object for the redirect destination
        // If redirectTo starts with '/', it's a relative path on your site
        let finalRedirectUrl;
        if (decodedRedirectTo.startsWith("/")) {
          // Use NEXT_PUBLIC_SITE_URL if available, otherwise fall back to request.url
          if (siteUrl) {
            finalRedirectUrl = new URL(decodedRedirectTo, siteUrl);
          } else {
            finalRedirectUrl = new URL(decodedRedirectTo, request.url);
          }
        } else {
          finalRedirectUrl = new URL(decodedRedirectTo);
        }

        // Set a cookie to prevent page reload loops
        const response = NextResponse.redirect(finalRedirectUrl);
        response.cookies.set("auth_redirect_completed", "true", {
          path: "/",
          maxAge: 30, // Short-lived cookie - 30 seconds
          httpOnly: true,
          sameSite: "lax",
        });

        return response;
      }
    } catch (err) {
      console.error("Unexpected error in auth callback:", err);
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_error", request.url)
      );
    }
  }

  // Fallback if code is missing
  return NextResponse.redirect(
    new URL("/login?error=missing_code", request.url)
  );
}
