// app/api/app-settings/route.ts
// Server-side API route to retrieve application settings (e.g., available colors).

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/app-settings
// Returns all rows from the app_settings table (color palette, etc.)
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      logger.error("GET /api/app-settings error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/app-settings unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
