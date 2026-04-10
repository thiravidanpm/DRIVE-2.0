"use server";

import { supabase } from "@/lib/supabase";

// Get user by ID
export async function getUserById(userId: number) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, roll_number, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get user scores
export async function getUserScores(userId: number) {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get user progress
export async function getUserProgress(userId: number) {
  try {
    const { data, error } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get leaderboard
export async function getLeaderboard(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select("users:user_id(roll_number), score, level, created_at")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Submit test score
export async function submitTestScore(
  userId: number,
  level: number,
  score: number,
  totalQuestions: number,
  correctAnswers: number
) {
  try {
    const { data, error } = await supabase.from("scores").insert([
      {
        user_id: userId,
        level,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
      },
    ]);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Update user progress
export async function updateUserProgress(
  userId: number,
  currentLevel: number,
  testsCompleted: number
) {
  try {
    const { data: existing } = await supabase
      .from("progress")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from("progress")
        .update({
          current_level: currentLevel,
          tests_completed: testsCompleted,
          updated_at: new Date(),
        })
        .eq("user_id", userId);
    } else {
      result = await supabase.from("progress").insert([
        {
          user_id: userId,
          current_level: currentLevel,
          tests_completed: testsCompleted,
        },
      ]);
    }

    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
