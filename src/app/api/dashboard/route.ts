// app/api/dashboard/route.ts
// Aggregate dashboard statistics for the authenticated user.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

function formatDateForPostgres(date: Date): string {
  return date.toISOString().split("T")[0];
}

// GET /api/dashboard
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const supabase = createServerComponentClient({ cookies });
  const userId = session.user.id;

  try {
    const today = new Date();
    const todayStr = formatDateForPostgres(today);
    const tomorrowStr = formatDateForPostgres(new Date(today.getTime() + 86400000));

    const [totalRes, completedRes, overdueRes, dueTodayRes] = await Promise.allSettled([
      supabase
        .from("task")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_deleted", false),
      supabase
        .from("task")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true)
        .eq("is_deleted", false),
      supabase
        .from("task")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", false)
        .eq("is_deleted", false)
        .lt("due_date", todayStr),
      supabase
        .from("task")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", false)
        .eq("is_deleted", false)
        .gte("due_date", todayStr)
        .lt("due_date", tomorrowStr),
    ]);

    const total = totalRes.status === "fulfilled" ? totalRes.value.count ?? 0 : 0;
    const completed = completedRes.status === "fulfilled" ? completedRes.value.count ?? 0 : 0;
    const overdue = overdueRes.status === "fulfilled" ? overdueRes.value.count ?? 0 : 0;
    const dueToday = dueTodayRes.status === "fulfilled" ? dueTodayRes.value.count ?? 0 : 0;
    const pending = Math.max(0, total - completed);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Today activity
    const [todayCompletedRes, todayCreatedRes] = await Promise.allSettled([
      supabase
        .from("task")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true)
        .gte("date_completed", todayStr)
        .lt("date_completed", tomorrowStr),
      supabase
        .from("task")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", todayStr)
        .lt("created_at", tomorrowStr),
    ]);

    const todayCompleted =
      todayCompletedRes.status === "fulfilled" ? todayCompletedRes.value.count ?? 0 : 0;
    const todayCreated =
      todayCreatedRes.status === "fulfilled" ? todayCreatedRes.value.count ?? 0 : 0;

    // Priority (pinned) tasks
    const { data: priorityTasks } = await supabase
      .from("task")
      .select("*")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .eq("is_completed", false)
      .eq("is_deleted", false)
      .order("due_date", { ascending: true })
      .limit(10);

    return NextResponse.json({
      stats: {
        total,
        completed,
        pending,
        overdue,
        dueToday,
        completionRate,
        todayCompleted,
        todayCreated,
      },
      priorityTasks: priorityTasks ?? [],
    });
  } catch (err) {
    logger.error("GET /api/dashboard unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
