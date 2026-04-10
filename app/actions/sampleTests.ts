"use server";

import { supabase } from "@/lib/supabase";

// Save sample test attempt
export async function saveSampleTestAttempt(
  userId: number,
  questions: any[],
  answers: number[],
  marks: number
) {
  try {
    const totalQuestions = questions.length;
    const correctAnswers = answers.filter(
      (ans, idx) => ans === questions[idx].correct_option - 1
    ).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    const { data, error } = await supabase
      .from("sample_tests")
      .insert([
        {
          user_id: userId,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          percentage,
          marks,
          attempted_at: new Date(),
        },
      ])
      .select();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data, marks, percentage };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get user sample test history
export async function getUserSampleTestHistory(userId: number) {
  try {
    const { data, error } = await supabase
      .from("sample_tests")
      .select("*")
      .eq("user_id", userId)
      .order("attempted_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get sample test statistics for user
export async function getSampleTestStats(userId: number) {
  try {
    const { data, error } = await supabase
      .from("sample_tests")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          total_attempts: 0,
          average_percentage: 0,
          best_percentage: 0,
          total_marks: 0,
        },
      };
    }

    const total_attempts = data.length;
    const total_percentage = data.reduce((sum, test) => sum + test.percentage, 0);
    const average_percentage = Math.round(total_percentage / total_attempts);
    const best_percentage = Math.max(...data.map((t) => t.percentage));
    const total_marks = data.reduce((sum, test) => sum + test.marks, 0);

    return {
      success: true,
      data: {
        total_attempts,
        average_percentage,
        best_percentage,
        total_marks,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
