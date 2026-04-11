"use server";

import { supabase } from "@/lib/supabase";

// Get current week number
export async function getCurrentWeek(): Promise<{ success: boolean; week: number }> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("current_week")
      .eq("id", 1)
      .single();

    if (error) {
      return { success: false, week: 1 };
    }

    return { success: true, week: data?.current_week || 1 };
  } catch {
    return { success: false, week: 1 };
  }
}

// Check if user has completed the current week's test
export async function hasUserCompletedWeek(
  userId: number,
  weekNumber: number
): Promise<{ completed: boolean; result?: { score: number; total_questions: number; percentage: number; completed_at: string } }> {
  try {
    const { data, error } = await supabase
      .from("weekly_results")
      .select("score, total_questions, percentage, completed_at")
      .eq("user_id", userId)
      .eq("week_number", weekNumber)
      .single();

    if (error && error.code === "PGRST116") {
      // No row found = not completed
      return { completed: false };
    }

    if (error) {
      return { completed: false };
    }

    return { completed: true, result: data };
  } catch {
    return { completed: false };
  }
}

// Save weekly test result (one-time per week per user)
export async function saveWeeklyResult(
  userId: number,
  weekNumber: number,
  score: number,
  totalQuestions: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already completed
    const { data: existing } = await supabase
      .from("weekly_results")
      .select("id")
      .eq("user_id", userId)
      .eq("week_number", weekNumber)
      .single();

    if (existing) {
      return { success: false, message: "You have already completed this week's test" };
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const { error } = await supabase
      .from("weekly_results")
      .insert([{
        user_id: userId,
        week_number: weekNumber,
        score,
        total_questions: totalQuestions,
        percentage,
        completed_at: new Date().toISOString(),
      }]);

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return { success: false, message: "You have already completed this week's test" };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Test result saved successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get weekly leaderboard for a specific week
export async function getWeeklyLeaderboard(weekNumber: number): Promise<{
  success: boolean;
  data?: { roll_number: string; score: number; percentage: number; completed_at: string }[];
}> {
  try {
    const { data, error } = await supabase
      .from("weekly_results")
      .select("score, percentage, completed_at, users:user_id(roll_number)")
      .eq("week_number", weekNumber)
      .order("score", { ascending: false });

    if (error) {
      return { success: false };
    }

    const formatted = (data || [])
      .filter((entry: any) => entry.users)
      .map((entry: any) => ({
        roll_number: entry.users.roll_number,
        score: entry.score,
        percentage: entry.percentage,
        completed_at: entry.completed_at,
      }));

    return { success: true, data: formatted };
  } catch {
    return { success: false };
  }
}

// Get all weekly results for all weeks (for leaderboard overview)
export async function getAllWeeklyResults(): Promise<{
  success: boolean;
  data?: { week_number: number; roll_number: string; score: number; percentage: number }[];
}> {
  try {
    const { data, error } = await supabase
      .from("weekly_results")
      .select("week_number, score, percentage, users:user_id(roll_number)")
      .order("week_number", { ascending: true })
      .order("score", { ascending: false });

    if (error) {
      return { success: false };
    }

    const formatted = (data || [])
      .filter((entry: any) => entry.users)
      .map((entry: any) => ({
        week_number: entry.week_number,
        roll_number: entry.users.roll_number,
        score: entry.score,
        percentage: entry.percentage,
      }));

    return { success: true, data: formatted };
  } catch {
    return { success: false };
  }
}

// Admin: Start a new week (increment week counter)
export async function startNewWeek(): Promise<{ success: boolean; message: string; newWeek?: number }> {
  try {
    // Get current week
    const { data: config } = await supabase
      .from("app_config")
      .select("current_week")
      .eq("id", 1)
      .single();

    const currentWeek = config?.current_week || 1;
    const newWeek = currentWeek + 1;

    // Update week
    const { error } = await supabase
      .from("app_config")
      .update({ current_week: newWeek, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) {
      return { success: false, message: error.message };
    }

    // Log
    try {
      await supabase.from("admin_logs").insert([{
        action: "New Week Started",
        details: `Advanced from Week ${currentWeek} to Week ${newWeek}. All students can now take the test again.`,
        status: "Success",
      }]);
    } catch {
      // Non-critical
    }

    return { success: true, message: `Started Week ${newWeek}! All students can now take the test.`, newWeek };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Admin: Reset specific users' weekly results (allow them to retest)
export async function resetUsersForWeek(
  userIds: number[],
  weekNumber: number
): Promise<{ success: boolean; message: string; resetCount: number }> {
  try {
    const { data, error } = await supabase
      .from("weekly_results")
      .delete()
      .eq("week_number", weekNumber)
      .in("user_id", userIds)
      .select();

    if (error) {
      return { success: false, message: error.message, resetCount: 0 };
    }

    const resetCount = data?.length || 0;

    // Log
    try {
      await supabase.from("admin_logs").insert([{
        action: "Reset Users",
        details: `Reset ${resetCount} user(s) for Week ${weekNumber}. User IDs: ${userIds.join(", ")}`,
        status: "Success",
      }]);
    } catch {
      // Non-critical
    }

    return {
      success: true,
      message: `Reset ${resetCount} user(s) for Week ${weekNumber}. They can now retake the test.`,
      resetCount,
    };
  } catch (error: any) {
    return { success: false, message: error.message, resetCount: 0 };
  }
}

// Get user's history across all weeks
export async function getUserWeeklyHistory(userId: number): Promise<{
  success: boolean;
  data?: { week_number: number; score: number; total_questions: number; percentage: number; completed_at: string }[];
  totalScore?: number;
}> {
  try {
    const { data, error } = await supabase
      .from("weekly_results")
      .select("week_number, score, total_questions, percentage, completed_at")
      .eq("user_id", userId)
      .order("week_number", { ascending: false });

    if (error) {
      return { success: false };
    }

    const totalScore = (data || []).reduce((sum, r) => sum + r.score, 0);
    return { success: true, data: data || [], totalScore };
  } catch {
    return { success: false };
  }
}

// Get cumulative leaderboard (total scores across ALL weeks)
export async function getCumulativeLeaderboard(): Promise<{
  success: boolean;
  data?: { roll_number: string; total_score: number; weeks_completed: number; avg_percentage: number }[];
}> {
  try {
    const { data, error } = await supabase
      .from("weekly_results")
      .select("user_id, score, percentage, users:user_id(roll_number)");

    if (error) {
      return { success: false };
    }

    // Group by user and sum scores
    const userMap = new Map<number, { roll_number: string; total_score: number; weeks: number; totalPercentage: number }>();
    for (const entry of data || []) {
      const u = entry as any;
      if (!u.users) continue;
      const uid = u.user_id;
      if (!userMap.has(uid)) {
        userMap.set(uid, { roll_number: u.users.roll_number, total_score: 0, weeks: 0, totalPercentage: 0 });
      }
      const rec = userMap.get(uid)!;
      rec.total_score += u.score;
      rec.weeks += 1;
      rec.totalPercentage += u.percentage;
    }

    const result = Array.from(userMap.values())
      .map((r) => ({
        roll_number: r.roll_number,
        total_score: r.total_score,
        weeks_completed: r.weeks,
        avg_percentage: r.weeks > 0 ? Math.round(r.totalPercentage / r.weeks) : 0,
      }))
      .sort((a, b) => b.total_score - a.total_score);

    return { success: true, data: result };
  } catch {
    return { success: false };
  }
}

// Get current week's questions (for test page)
export async function getCurrentWeekQuestions(): Promise<{
  success: boolean;
  data?: any[];
  week: number;
}> {
  try {
    const { week } = await getCurrentWeek();

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("level", 1)
      .eq("week_number", week)
      .order("id", { ascending: true });

    if (error) {
      return { success: false, week };
    }

    return { success: true, data: data || [], week };
  } catch {
    return { success: false, week: 1 };
  }
}

// Get users who completed current week and who haven't
export async function getWeeklyCompletionStatus(weekNumber: number): Promise<{
  success: boolean;
  completed: { user_id: number; roll_number: string; score: number; percentage: number }[];
  pending: { user_id: number; roll_number: string }[];
}> {
  try {
    // Get all users
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, roll_number")
      .order("roll_number");

    // Get completed users for this week
    const { data: completedResults } = await supabase
      .from("weekly_results")
      .select("user_id, score, percentage")
      .eq("week_number", weekNumber);

    const completedMap = new Map(
      (completedResults || []).map((r) => [r.user_id, r])
    );

    const completed: { user_id: number; roll_number: string; score: number; percentage: number }[] = [];
    const pending: { user_id: number; roll_number: string }[] = [];

    for (const user of allUsers || []) {
      const result = completedMap.get(user.id);
      if (result) {
        completed.push({
          user_id: user.id,
          roll_number: user.roll_number,
          score: result.score,
          percentage: result.percentage,
        });
      } else {
        pending.push({ user_id: user.id, roll_number: user.roll_number });
      }
    }

    return { success: true, completed, pending };
  } catch {
    return { success: true, completed: [], pending: [] };
  }
}
