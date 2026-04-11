"use server";

import { supabase } from "@/lib/supabase";

// Get questions by level
export async function getQuestionsByLevel(level: number, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("level", level)
      .limit(limit)
      .order("id", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get all questions for admin
export async function getAllQuestions(level?: number) {
  try {
    let query = supabase.from("questions").select("*");

    if (level) {
      query = query.eq("level", level);
    }

    const { data, error } = await query.order("level");

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Add new question
export async function addQuestion(
  level: number,
  category: string,
  questionText: string,
  options: [string, string, string, string],
  correctOption: number,
  difficulty: string = "Medium",
  source: string = "Manual"
) {
  try {
    const { data, error } = await supabase.from("questions").insert([
      {
        level,
        category,
        question_text: questionText,
        option_a: options[0],
        option_b: options[1],
        option_c: options[2],
        option_d: options[3],
        correct_option: correctOption,
        difficulty,
        source,
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

// Delete question
export async function deleteQuestion(questionId: number) {
  try {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Update question
export async function updateQuestion(
  questionId: number,
  updates: {
    question_text?: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_option?: number;
    category?: string;
    difficulty?: string;
  }
) {
  try {
    const { error } = await supabase
      .from("questions")
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq("id", questionId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Log question update
export async function logQuestionUpdate(
  level: number,
  questionsAdded: number,
  questionsReplaced: number
) {
  try {
    const { error } = await supabase.from("question_update_log").insert([
      {
        level,
        questions_added: questionsAdded,
        questions_replaced: questionsReplaced,
      },
    ]);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get question count by level
export async function getQuestionCountByLevel() {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("level, id")
      .order("level");

    if (error) {
      return { success: false, message: error.message };
    }

    const counts = {
      level1: 0,
      level2: 0,
    };

    data?.forEach((q) => {
      if (q.level === 1) counts.level1++;
      else if (q.level === 2) counts.level2++;
    });

    return { success: true, data: counts };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Sync questions using Groq AI generation
export async function syncQuestionsFromWebhook() {
  try {
    const { generateAndSyncQuestions } = await import("@/lib/groqService");
    const result = await generateAndSyncQuestions();
    return result;
  } catch (error: any) {
    console.error("AI sync error:", error);
    return {
      success: false,
      message: error.message || "Unknown error during AI question generation",
      data: { count: 0, added: 0, duplicates: 0, errors: [error.message] },
    };
  }
}

// Get all questions for download
export async function getAllQuestionsForDownload(level?: number) {
  try {
    let query = supabase.from("questions").select("*");

    if (level) {
      query = query.eq("level", level);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}



