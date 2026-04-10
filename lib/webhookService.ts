// lib/webhookService.ts
/**
 * Robust webhook sync service with error handling and retries
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
const FETCH_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Main webhook sync function with comprehensive error handling
 */
export async function syncQuestionsFromWebhookRobust(
  onProgress?: (progress: SyncProgress) => void
): Promise<WebhookSyncResult> {
  const errors: string[] = [];
  let retryCount = 0;

  // Progress callback helper
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
    // STEP 1: Validate webhook URL
    updateProgress("connecting", 10, "Validating webhook configuration...");
    if (!WEBHOOK_URL) {
      errors.push("Webhook URL not configured");
      updateProgress("error", 0, "Webhook URL not configured");
      return {
        success: false,
        message: "Webhook URL not configured",
        data: { count: 0, added: 0, duplicates: 0, errors },
      };
    }

    // STEP 2: Fetch data with retry logic
    updateProgress("fetching", 20, "Fetching questions from webhook...");
    let webhookData: any = null;
    let lastError: Error | null = null;

    for (retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
      try {
        webhookData = await fetchWithTimeout(WEBHOOK_URL, FETCH_TIMEOUT);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        const retryMsg =
          retryCount < MAX_RETRIES - 1
            ? `Retry ${retryCount + 1}/${MAX_RETRIES}...`
            : "All retries exhausted";
        errors.push(`Fetch attempt ${retryCount + 1}: ${error.message}`);
        console.warn(`Webhook fetch failed: ${error.message}. ${retryMsg}`);

        if (retryCount < MAX_RETRIES - 1) {
          updateProgress(
            "fetching",
            20 + retryCount * 10,
            `Fetch failed. ${retryMsg}`
          );
          await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
          continue;
        }
      }
    }

    if (!webhookData) {
      const errorMsg = `Failed to fetch from webhook after ${MAX_RETRIES} retries: ${lastError?.message}`;
      errors.push(errorMsg);
      updateProgress("error", 0, errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: { count: 0, added: 0, duplicates: 0, errors },
      };
    }

    // STEP 3: Validate response structure
    updateProgress("fetching", 25, "Validating webhook response...");
    if (!webhookData.body) {
      const errorMsg = "Webhook response missing 'body' field";
      errors.push(errorMsg);
      updateProgress("error", 0, errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: { count: 0, added: 0, duplicates: 0, errors },
      };
    }

    // STEP 4: Parse questions
    updateProgress("parsing", 40, "Parsing questions from webhook...");
    let parsedQuestions: any[] = [];

    try {
      parsedQuestions = parseWebhookResponse(webhookData.body);

      if (parsedQuestions.length === 0) {
        const errorMsg = "No valid questions found in webhook response";
        errors.push(errorMsg);
        updateProgress("error", 0, errorMsg);
        return {
          success: false,
          message: errorMsg,
          data: { count: 0, added: 0, duplicates: 0, errors },
        };
      }

      updateProgress(
        "parsing",
        50,
        `Successfully parsed ${parsedQuestions.length} questions`
      );
    } catch (parseError: any) {
      const errorMsg = `Failed to parse questions: ${parseError.message}`;
      errors.push(errorMsg);
      updateProgress("error", 0, errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: { count: 0, added: 0, duplicates: 0, errors },
      };
    }

    // STEP 5: Validate parsed questions
    updateProgress("validating", 55, "Validating parsed questions...");
    const validQuestions = parsedQuestions.filter((q) => {
      const isValid =
        q.question_text &&
        q.option_a &&
        q.option_b &&
        q.option_c &&
        q.option_d &&
        q.correct_option >= 1 &&
        q.correct_option <= 4;

      if (!isValid) {
        errors.push(
          `Invalid question: ${q.question_text?.substring(0, 50) || "Unknown"}`
        );
      }

      return isValid;
    });

    const invalidCount = parsedQuestions.length - validQuestions.length;
    if (invalidCount > 0) {
      console.warn(`Skipped ${invalidCount} invalid questions`);
      updateProgress(
        "validating",
        58,
        `${invalidCount} invalid questions skipped`
      );
    }

    if (validQuestions.length === 0) {
      const errorMsg = "No valid questions after validation";
      errors.push(errorMsg);
      updateProgress("error", 0, errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: { count: 0, added: 0, duplicates: 0, errors },
      };
    }

    updateProgress("validating", 60, `Validated ${validQuestions.length} questions`);

    // STEP 6: Check for existing questions (deduplication)
    updateProgress("validating", 65, "Checking for duplicates...");
    let duplicateCount = 0;
    const newQuestions: any[] = [];

    try {
      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("question_text")
        .eq("source", "Webhook")
        .eq("level", 1);

      const existingTexts = new Set(
        (existingQuestions || []).map((q) => q.question_text.toLowerCase())
      );

      for (const q of validQuestions) {
        if (existingTexts.has(q.question_text.toLowerCase())) {
          duplicateCount++;
        } else {
          newQuestions.push(q);
        }
      }

      if (duplicateCount > 0) {
        console.log(`Found ${duplicateCount} duplicate questions, skipping...`);
      }
    } catch (dupError: any) {
      console.warn("Error checking duplicates:", dupError.message);
      // Continue anyway with all questions
      newQuestions.push(...validQuestions);
    }

    updateProgress("validating", 70, `Found ${duplicateCount} duplicates, ${newQuestions.length} new`);

    if (newQuestions.length === 0) {
      const msg = `All ${validQuestions.length} questions already exist`;
      console.log(msg);
      return {
        success: true,
        message: msg,
        data: { count: 0, added: 0, duplicates: duplicateCount, errors },
      };
    }

    // STEP 7: Delete old questions
    updateProgress("deleting", 75, "Clearing old L1 webhook questions...");

    try {
      const { error: deleteError, count: deletedCount } = await supabase
        .from("questions")
        .delete()
        .eq("level", 1)
        .eq("source", "Webhook");

      if (deleteError) {
        console.warn("Delete warning:", deleteError.message);
        // Don't fail if delete fails - just continue
      } else {
        console.log(`Deleted ${deletedCount || 0} old questions`);
      }

      updateProgress("deleting", 80, `Deleted ${deletedCount || 0} old questions`);
    } catch (deleteException: any) {
      console.warn("Delete exception:", deleteException.message);
      updateProgress("deleting", 80, "Warning: Could not delete all old questions");
    }

    // STEP 8: Insert new questions in batches
    updateProgress("inserting", 85, `Inserting ${newQuestions.length} new questions...`);

    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < newQuestions.length; i += batchSize) {
      batches.push(newQuestions.slice(i, i + batchSize));
    }

    let insertedCount = 0;
    let insertErrors: string[] = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchProgress = 85 + (batchIdx / batches.length) * 12;

      try {
        const questionsToInsert = batch.map((q) => ({
          level: q.level || 1,
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

        const { error: insertError, data: insertedData } = await supabase
          .from("questions")
          .insert(questionsToInsert)
          .select();

        if (insertError) {
          insertErrors.push(`Batch ${batchIdx + 1}: ${insertError.message}`);
          console.error(`Insert batch ${batchIdx + 1} failed:`, insertError);
        } else {
          insertedCount += insertedData?.length || 0;
          updateProgress(
            "inserting",
            batchProgress,
            `Inserted ${insertedCount}/${newQuestions.length} questions`
          );
        }
      } catch (batchError: any) {
        insertErrors.push(`Batch ${batchIdx + 1}: ${batchError.message}`);
        console.error(`Insert batch ${batchIdx + 1} exception:`, batchError);
      }
    }

    if (insertErrors.length > 0) {
      errors.push(...insertErrors);
    }

    // STEP 9: Log the sync
    updateProgress("inserting", 97, "Logging sync operation...");

    try {
      await supabase.from("admin_logs").insert([
        {
          action: "Sync Questions",
          details: `Synced ${insertedCount} new questions. Duplicates: ${duplicateCount}. Errors: ${insertErrors.length}`,
          status: insertedCount > 0 ? "Success" : "Failed",
        },
      ]);
    } catch (logError: any) {
      console.warn("Log error:", logError.message);
      // Non-critical error
    }

    // STEP 10: Complete
    updateProgress("complete", 100, "Webhook sync complete!");

    return {
      success: insertedCount > 0,
      message:
        insertedCount > 0
          ? `Successfully synced ${insertedCount} questions (${duplicateCount} duplicates skipped)`
          : "Sync complete but no questions were added",
      data: {
        count: newQuestions.length,
        added: insertedCount,
        duplicates: duplicateCount,
        errors,
      },
    };
  } catch (unexpectedError: any) {
    const errorMsg = `Unexpected error during sync: ${unexpectedError.message}`;
    errors.push(errorMsg);
    console.error(errorMsg, unexpectedError);
    updateProgress("error", 0, errorMsg);

    return {
      success: false,
      message: errorMsg,
      data: { count: 0, added: 0, duplicates: 0, errors },
    };
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Utility function for delays
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
