// lib/webhookService.ts
/**
 * Webhook sync service — calls ActivePieces /sync endpoint which holds
 * the connection open until the flow completes (~2 min), then returns questions.
 * 204 = no data / flow didn't run. 200 = flow completed with data.
 */

import { parseWebhookResponse } from "./webhookParser";
import { supabase } from "./supabase";

export interface WebhookSyncResult {
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

const WEBHOOK_URL = "https://cloud.activepieces.com/api/v1/webhooks/R4qAlnXmM0gvEUEVoDwF1/sync";
const FETCH_TIMEOUT = 180000; // 3 minutes max — flow takes ~2 min

/**
 * Main sync: single fetch call, waits for the /sync response (up to 3 min).
 * No retries — retrying queues duplicate flows in ActivePieces.
 */
export async function syncQuestionsFromWebhookRobust(
  onProgress?: (progress: SyncProgress) => void
): Promise<WebhookSyncResult> {
  const errors: string[] = [];

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
    // STEP 1: Call webhook — holds connection open until flow completes
    updateProgress("connecting", 10, "Calling webhook — waiting for flow to complete (~2 min)...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let response: Response;
    try {
      response = await fetch(WEBHOOK_URL, {
        signal: controller.signal,
        headers: { Accept: "*/*" },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return {
          success: false,
          message: "Webhook timed out after 3 minutes — flow may still be running, try again later",
          data: { count: 0, added: 0, duplicates: 0, errors: ["Timeout after 3 min"] },
        };
      }
      return {
        success: false,
        message: `Webhook fetch failed: ${fetchError.message}`,
        data: { count: 0, added: 0, duplicates: 0, errors: [fetchError.message] },
      };
    }
    clearTimeout(timeoutId);

    // STEP 2: Check response status
    if (response.status === 204) {
      updateProgress("error", 0, "Webhook returned 204 — no data returned");
      return {
        success: false,
        message: "Webhook returned no data (204). The flow may not have run.",
        data: { count: 0, added: 0, duplicates: 0, errors: ["HTTP 204 No Content"] },
      };
    }

    if (!response.ok) {
      const errorMsg = `Webhook returned HTTP ${response.status}`;
      return {
        success: false,
        message: errorMsg,
        data: { count: 0, added: 0, duplicates: 0, errors: [errorMsg] },
      };
    }

    updateProgress("fetching", 50, "Response received — parsing data...");

    // STEP 3: Read and parse response
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        message: "Webhook returned empty response body",
        data: { count: 0, added: 0, duplicates: 0, errors: ["Empty response"] },
      };
    }

    // Response shape: { "status": 200, "headers": {}, "body": "..." }
    let rawBody: string;
    try {
      const jsonData = JSON.parse(text);
      if (jsonData.body) {
        rawBody = typeof jsonData.body === "string" ? jsonData.body : JSON.stringify(jsonData.body);
      } else if (Array.isArray(jsonData)) {
        rawBody = text;
      } else {
        rawBody = text;
      }
    } catch {
      rawBody = text;
    }

    // STEP 4: Parse questions from the body
    updateProgress("parsing", 60, "Parsing questions...");
    let parsedQuestions = parseWebhookResponse(rawBody);

    if (parsedQuestions.length === 0) {
      return {
        success: false,
        message: "Webhook returned data but no valid questions could be parsed",
        data: { count: 0, added: 0, duplicates: 0, errors: ["No parseable questions"] },
      };
    }

    updateProgress("validating", 65, `Parsed ${parsedQuestions.length} questions — validating...`);

    // STEP 5: Validate
    const validQuestions = parsedQuestions.filter((q) =>
      q.question_text && q.option_a && q.option_b && q.option_c && q.option_d &&
      q.correct_option >= 1 && q.correct_option <= 4
    );

    if (validQuestions.length === 0) {
      return {
        success: false,
        message: "All parsed questions failed validation",
        data: { count: 0, added: 0, duplicates: 0, errors: ["Validation failed"] },
      };
    }

    // STEP 6: Deduplicate
    updateProgress("validating", 70, "Checking for duplicates...");
    let duplicateCount = 0;
    const newQuestions: typeof validQuestions = [];

    try {
      const { data: existing } = await supabase
        .from("questions")
        .select("question_text")
        .eq("source", "Webhook")
        .eq("level", 1);

      const existingTexts = new Set(
        (existing || []).map((q) => q.question_text.toLowerCase())
      );

      for (const q of validQuestions) {
        if (existingTexts.has(q.question_text.toLowerCase())) {
          duplicateCount++;
        } else {
          newQuestions.push(q);
        }
      }
    } catch {
      newQuestions.push(...validQuestions);
    }

    if (newQuestions.length === 0) {
      return {
        success: true,
        message: `All ${validQuestions.length} questions already exist`,
        data: { count: 0, added: 0, duplicates: duplicateCount, errors },
      };
    }

    // STEP 7: Delete old webhook questions
    updateProgress("deleting", 80, "Clearing old L1 webhook questions...");
    try {
      await supabase.from("questions").delete().eq("level", 1).eq("source", "Webhook");
    } catch {
      // Non-critical
    }

    // STEP 8: Insert new questions
    updateProgress("inserting", 85, `Inserting ${newQuestions.length} questions...`);
    const questionsToInsert = newQuestions.map((q) => ({
      level: 1,
      category: q.category || "General",
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      difficulty: q.difficulty || "Medium",
      source: "Webhook",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select();

    const insertedCount = inserted?.length || 0;

    if (insertError) {
      errors.push(insertError.message);
    }

    // STEP 9: Log
    try {
      await supabase.from("admin_logs").insert([{
        action: "Sync Questions",
        details: `Synced ${insertedCount} new questions. Duplicates: ${duplicateCount}.`,
        status: insertedCount > 0 ? "Success" : "Failed",
      }]);
    } catch {
      // Non-critical
    }

    updateProgress("complete", 100, `Sync complete! ${insertedCount} questions added.`);

    return {
      success: insertedCount > 0,
      message: insertedCount > 0
        ? `Successfully synced ${insertedCount} questions (${duplicateCount} duplicates skipped)`
        : "Sync complete but no new questions were added",
      data: { count: newQuestions.length, added: insertedCount, duplicates: duplicateCount, errors },
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
