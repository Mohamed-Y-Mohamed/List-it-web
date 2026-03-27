// app/api/dashboard/route.ts
// Aggregate dashboard statistics for the authenticated user.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { format, subDays } from "date-fns";

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
      .select("id, text, due_date, is_pinned, created_at")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .eq("is_completed", false)
      .eq("is_deleted", false)
      .order("due_date", { ascending: true })
      .limit(10);

    // 7-day daily metrics
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    const dailyMetrics = await Promise.all(
      last7Days.map(async (date) => {
        const dateStr = formatDateForPostgres(date);
        const nextDay = formatDateForPostgres(new Date(date.getTime() + 86400000));

        const [dayCompletedRes, dayCreatedRes] = await Promise.allSettled([
          supabase
            .from("task")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_completed", true)
            .gte("date_completed", dateStr)
            .lt("date_completed", nextDay),
          supabase
            .from("task")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", dateStr)
            .lt("created_at", nextDay),
        ]);

        const dayCompleted =
          dayCompletedRes.status === "fulfilled" ? dayCompletedRes.value.count ?? 0 : 0;
        const dayCreated =
          dayCreatedRes.status === "fulfilled" ? dayCreatedRes.value.count ?? 0 : 0;

        return {
          date: format(date, "MMM dd"),
          completed: dayCompleted,
          created: dayCreated,
          pending: Math.max(0, dayCreated - dayCompleted),
        };
      })
    );

    // Recent activity (10 most recent completed + 10 most recently created)
    const [recentCompletedRes, recentCreatedRes] = await Promise.allSettled([
      supabase
        .from("task")
        .select("id, text, date_completed, created_at")
        .eq("user_id", userId)
        .eq("is_completed", true)
        .order("date_completed", { ascending: false })
        .limit(10),
      supabase
        .from("task")
        .select("id, text, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const recentCompleted =
      recentCompletedRes.status === "fulfilled"
        ? recentCompletedRes.value.data ?? []
        : [];
    const recentCreated =
      recentCreatedRes.status === "fulfilled"
        ? recentCreatedRes.value.data ?? []
        : [];

    const recentActivity = [
      ...recentCompleted.map((task) => ({
        id: `completed-${task.id}`,
        type: "completed" as const,
        description: `Completed: ${task.text ?? "Untitled task"}`,
        timestamp: (task.date_completed ?? task.created_at) as string,
      })),
      ...recentCreated.map((task) => ({
        id: `created-${task.id}`,
        type: "created" as const,
        description: `Created: ${task.text ?? "Untitled task"}`,
        timestamp: task.created_at as string,
      })),
    ]
      .filter((item) => item.timestamp)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

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
      dailyMetrics,
      recentActivity,
    });
  } catch (err) {
    logger.error("GET /api/dashboard unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
