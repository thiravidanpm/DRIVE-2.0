// lib/groqService.ts
/**
 * Groq AI service for generating aptitude questions.
 * Uses Groq's fast LLM inference to generate IndiaBIX-style questions.
 */

import { supabase } from "./supabase";

export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    count: number;
    added: number;
    duplicates: number;
    errors: string[];
  };
}

export interface SyncProgress {
  stage: "connecting" | "fetching" | "parsing" | "validating" | "deleting" | "inserting" | "complete" | "error";
  progress: number;
  message: string;
}

interface GeneratedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
  category: string;
  difficulty: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// All topics from IndiaBIX
const ALL_TOPICS = [
  "Number System", "LCM and HCF", "Percentage", "Profit and Loss",
  "Simple Interest", "Compound Interest", "Ratio and Proportion", "Partnership",
  "Average", "Ages", "Mixtures and Alligations", "Time and Work",
  "Pipes and Cisterns", "Time Speed and Distance", "Boats and Streams", "Trains",
  "Permutations and Combinations", "Probability", "Logarithms",
  "Seating Arrangement Linear", "Seating Arrangement Circular", "Puzzles",
  "Blood Relations", "Direction Sense", "Order and Ranking", "Coding Decoding",
  "Syllogisms", "Statements and Conclusions", "Statements and Assumptions",
  "Cause and Effect", "Assertion and Reason", "Series Number", "Series Alphabet",
  "Odd One Out", "Analogy", "Grammar", "Vocabulary", "Sentence Completion",
  "Reading Comprehension", "Data Sufficiency Logical", "Mirror Images", "Decision Making",
];

// Map topics to valid DB categories
const TOPIC_CATEGORY_MAP: Record<string, string> = {
  "Number System": "Quantitative", "LCM and HCF": "Quantitative",
  "Percentage": "Quantitative", "Profit and Loss": "Quantitative",
  "Simple Interest": "Quantitative", "Compound Interest": "Quantitative",
  "Ratio and Proportion": "Quantitative", "Partnership": "Quantitative",
  "Average": "Quantitative", "Ages": "Quantitative",
  "Mixtures and Alligations": "Quantitative", "Time and Work": "Aptitude",
  "Pipes and Cisterns": "Aptitude", "Time Speed and Distance": "Aptitude",
  "Boats and Streams": "Aptitude", "Trains": "Aptitude",
  "Permutations and Combinations": "Quantitative", "Probability": "Quantitative",
  "Logarithms": "Quantitative",
  "Seating Arrangement Linear": "Logical Reasoning", "Seating Arrangement Circular": "Logical Reasoning",
  "Puzzles": "Logical Reasoning", "Blood Relations": "Logical Reasoning",
  "Direction Sense": "Logical Reasoning", "Order and Ranking": "Logical Reasoning",
  "Coding Decoding": "Logical Reasoning", "Syllogisms": "Logical Reasoning",
  "Statements and Conclusions": "Logical Reasoning", "Statements and Assumptions": "Logical Reasoning",
  "Cause and Effect": "Logical Reasoning", "Assertion and Reason": "Logical Reasoning",
  "Series Number": "Pattern Recognition", "Series Alphabet": "Pattern Recognition",
  "Odd One Out": "Pattern Recognition", "Analogy": "Pattern Recognition",
  "Grammar": "Verbal", "Vocabulary": "Verbal",
  "Sentence Completion": "Verbal", "Reading Comprehension": "Verbal",
  "Data Sufficiency Logical": "Logical Reasoning", "Mirror Images": "Pattern Recognition",
  "Decision Making": "General",
};

function pickRandomTopics(count: number): string[] {
  const shuffled = [...ALL_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildPrompt(topics: string[], questionCount: number): string {
  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join("\n");

  return `You are an expert aptitude test question generator. Generate exactly ${questionCount} multiple choice questions in the style of IndiaBIX.

Cover these topics (1 question per topic):
${topicList}

RULES:
- Each question must have exactly 4 options (A, B, C, D)
- Provide the correct answer as a number: 1=A, 2=B, 3=C, 4=D
- Questions should be challenging but solvable
- Mix difficulty levels: some Easy, some Medium, some Hard
- Do NOT repeat questions commonly found online — generate unique variations

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question": "question text here",
    "option_a": "option A text",
    "option_b": "option B text",
    "option_c": "option C text",
    "option_d": "option D text",
    "correct_option": 1,
    "topic": "Topic Name",
    "difficulty": "Easy|Medium|Hard"
  }
]`;
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set in environment variables");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a JSON-only question generator. Return only valid JSON arrays. No markdown, no code blocks, no explanations.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseGroqResponse(content: string): GeneratedQuestion[] {
  // Strip markdown code blocks if any
  let cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Find the JSON array
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error("No JSON array found in response");
  }
  cleaned = cleaned.substring(arrayStart, arrayEnd + 1);

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("Response is not an array");
  }

  return parsed
    .map((item: any) => {
      const topic = item.topic || "General";
      const category = TOPIC_CATEGORY_MAP[topic] || "General";
      const difficulty = ["Easy", "Medium", "Hard"].includes(item.difficulty) ? item.difficulty : "Medium";

      let correctOption = parseInt(item.correct_option);
      if (isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
        // Try to map letter answers
        const ans = String(item.correct_option || item.answer || "").toLowerCase().trim();
        if (ans === "a" || ans === "1") correctOption = 1;
        else if (ans === "b" || ans === "2") correctOption = 2;
        else if (ans === "c" || ans === "3") correctOption = 3;
        else if (ans === "d" || ans === "4") correctOption = 4;
        else correctOption = 1;
      }

      return {
        question_text: item.question || item.question_text || "",
        option_a: item.option_a || "",
        option_b: item.option_b || "",
        option_c: item.option_c || "",
        option_d: item.option_d || "",
        correct_option: correctOption,
        category,
        difficulty,
      };
    })
    .filter(
      (q) =>
        q.question_text &&
        q.option_a &&
        q.option_b &&
        q.option_c &&
        q.option_d &&
        q.correct_option >= 1 &&
        q.correct_option <= 4
    );
}

/**
 * Generate questions using Groq AI and store in Supabase.
 * Ensures all 10 questions are unique across ALL previous weeks.
 * Retries with Groq if duplicates are found.
 */
export async function generateAndSyncQuestions(
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  const errors: string[] = [];
  const MAX_RETRIES = 3;

  const updateProgress = (
    stage: SyncProgress["stage"],
    progress: number,
    message: string
  ) => {
    if (onProgress) {
      onProgress({ stage, progress, message });
    }
    console.log(`[${stage}] ${message} (${progress}%)`);
  };

  try {
    // STEP 1: Get current week number
    updateProgress("connecting", 5, "Reading current week...");
    const { data: config } = await supabase
      .from("app_config")
      .select("current_week")
      .eq("id", 1)
      .single();
    const currentWeek = config?.current_week || 1;

    // STEP 2: Load ALL existing question texts for dedup
    updateProgress("connecting", 10, "Loading question history for dedup...");
    const { data: existingQuestions } = await supabase
      .from("questions")
      .select("question_text")
      .eq("level", 1);
    const existingTexts = new Set(
      (existingQuestions || []).map((q) => q.question_text.toLowerCase().trim())
    );

    // STEP 3: Generate questions, retry until all 10 are unique
    let uniqueQuestions: GeneratedQuestion[] = [];
    let attempt = 0;

    while (uniqueQuestions.length < 10 && attempt < MAX_RETRIES) {
      attempt++;
      const needed = 10 - uniqueQuestions.length;
      const topics = pickRandomTopics(needed);

      updateProgress(
        "fetching",
        15 + attempt * 10,
        `Attempt ${attempt}: Generating ${needed} questions with AI...`
      );

      const prompt = buildPrompt(topics, needed);
      let rawContent: string;

      try {
        rawContent = await callGroq(prompt);
      } catch (error: any) {
        errors.push(`Attempt ${attempt} failed: ${error.message}`);
        continue;
      }

      if (!rawContent) {
        errors.push(`Attempt ${attempt}: Empty AI response`);
        continue;
      }

      updateProgress("parsing", 40 + attempt * 5, `Parsing attempt ${attempt}...`);
      let parsed: GeneratedQuestion[];
      try {
        parsed = parseGroqResponse(rawContent);
      } catch (parseError: any) {
        errors.push(`Attempt ${attempt} parse error: ${parseError.message}`);
        continue;
      }

      // Filter out duplicates against ALL history + already collected
      const collectedTexts = new Set(
        uniqueQuestions.map((q) => q.question_text.toLowerCase().trim())
      );
      for (const q of parsed) {
        const normalized = q.question_text.toLowerCase().trim();
        if (!existingTexts.has(normalized) && !collectedTexts.has(normalized)) {
          uniqueQuestions.push(q);
          collectedTexts.add(normalized);
          if (uniqueQuestions.length >= 10) break;
        }
      }

      updateProgress(
        "validating",
        50 + attempt * 10,
        `Have ${uniqueQuestions.length}/10 unique questions after attempt ${attempt}`
      );
    }

    if (uniqueQuestions.length === 0) {
      return {
        success: false,
        message: `Failed to generate unique questions after ${MAX_RETRIES} attempts`,
        data: { count: 0, added: 0, duplicates: 0, errors },
      };
    }

    const finalQuestions = uniqueQuestions.slice(0, 10);

    // STEP 4: Delete only current week's L1 questions (keep history)
    updateProgress("deleting", 75, "Removing current week's old questions...");
    await supabase
      .from("questions")
      .delete()
      .eq("level", 1)
      .eq("week_number", currentWeek);

    // STEP 5: Insert new questions with current week_number
    updateProgress("inserting", 85, `Inserting ${finalQuestions.length} questions for Week ${currentWeek}...`);
    const toInsert = finalQuestions.map((q) => ({
      level: 1,
      category: q.category,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      difficulty: q.difficulty,
      source: "AI",
      week_number: currentWeek,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("questions")
      .insert(toInsert)
      .select();

    const insertedCount = inserted?.length || 0;

    if (insertError) {
      errors.push(insertError.message);
      updateProgress("error", 0, `Insert error: ${insertError.message}`);
    }

    // STEP 6: Log
    try {
      await supabase.from("admin_logs").insert([{
        action: "Generate Questions",
        details: `Week ${currentWeek}: AI generated ${insertedCount} unique L1 questions (${attempt} attempt(s)).`,
        status: insertedCount > 0 ? "Success" : "Failed",
      }]);
    } catch {
      // Non-critical
    }

    updateProgress("complete", 100, `Done! ${insertedCount} questions added for Week ${currentWeek}.`);

    return {
      success: insertedCount > 0,
      message: insertedCount > 0
        ? `Week ${currentWeek}: ${insertedCount} unique AI questions generated (${attempt} attempt(s))`
        : "Questions generated but insert failed",
      data: { count: finalQuestions.length, added: insertedCount, duplicates: 10 - finalQuestions.length, errors },
    };
  } catch (unexpectedError: any) {
    const errorMsg = `Unexpected error: ${unexpectedError.message}`;
    errors.push(errorMsg);
    updateProgress("error", 0, errorMsg);
    return {
      success: false,
      message: errorMsg,
      data: { count: 0, added: 0, duplicates: 0, errors },
    };
  }
}

// Exported topics list for reference
export { ALL_TOPICS };
