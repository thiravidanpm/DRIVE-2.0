"use server";

import { supabase } from "@/lib/supabase";
import { runCodeAgainstTests, type TestCase } from "@/lib/pistonService";
import { scoreCodeWithAI } from "@/lib/groqCodeScorer";

const MARKS_PER_PROBLEM = 20; // Full marks when all test cases pass
const MAX_AI_SCORE = 15; // Max marks AI can give when test cases fail

// ==================== L2 WEEK MANAGEMENT ====================

export async function getL2CurrentWeek(): Promise<{ success: boolean; week: number }> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("l2_current_week")
      .eq("id", 1)
      .single();

    if (error) return { success: false, week: 1 };
    return { success: true, week: data?.l2_current_week || 1 };
  } catch {
    return { success: false, week: 1 };
  }
}

export async function startNewL2Week(): Promise<{ success: boolean; message: string; newWeek?: number }> {
  try {
    const { data: config } = await supabase
      .from("app_config")
      .select("l2_current_week")
      .eq("id", 1)
      .single();

    const currentWeek = config?.l2_current_week || 1;
    const newWeek = currentWeek + 1;

    // Check if next week has problems assigned
    const { data: nextProblems } = await supabase
      .from("l2_problems")
      .select("id")
      .eq("week_number", newWeek);

    if (!nextProblems || nextProblems.length === 0) {
      return { success: false, message: `No problems assigned to Week ${newWeek}. Assign problems first.` };
    }

    const { error } = await supabase
      .from("app_config")
      .update({ l2_current_week: newWeek, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) return { success: false, message: error.message };

    try {
      await supabase.from("admin_logs").insert([{
        action: "L2 New Week Started",
        details: `Advanced L2 from Week ${currentWeek} to Week ${newWeek}.`,
        status: "Success",
      }]);
    } catch { /* non-critical */ }

    return { success: true, message: `L2 Week ${newWeek} started!`, newWeek };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ==================== L2 PROBLEMS ====================

export async function getL2WeekProblems(weekNumber: number): Promise<{
  success: boolean;
  data?: any[];
}> {
  try {
    const { data, error } = await supabase
      .from("l2_problems")
      .select("*")
      .eq("week_number", weekNumber)
      .order("problem_order", { ascending: true });

    if (error) return { success: false };
    return { success: true, data: data || [] };
  } catch {
    return { success: false };
  }
}

export async function getAllL2Problems(): Promise<{
  success: boolean;
  data?: any[];
}> {
  try {
    const { data, error } = await supabase
      .from("l2_problems")
      .select("id, title, category, difficulty, step_number, week_number, problem_order")
      .order("step_number", { ascending: true })
      .order("problem_order", { ascending: true });

    if (error) return { success: false };
    return { success: true, data: data || [] };
  } catch {
    return { success: false };
  }
}

export async function assignProblemsToWeek(
  problemIds: number[],
  weekNumber: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Clear previous assignments for this week
    await supabase
      .from("l2_problems")
      .update({ week_number: null })
      .eq("week_number", weekNumber);

    // Assign selected problems
    for (let i = 0; i < problemIds.length; i++) {
      const { error } = await supabase
        .from("l2_problems")
        .update({ week_number: weekNumber, problem_order: i + 1 })
        .eq("id", problemIds[i]);

      if (error) {
        return { success: false, message: `Failed to assign problem ${problemIds[i]}: ${error.message}` };
      }
    }

    return { success: true, message: `Assigned ${problemIds.length} problems to Week ${weekNumber}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function autoAssignNextWeek(): Promise<{ success: boolean; message: string }> {
  try {
    const { week } = await getL2CurrentWeek();
    const nextWeek = week + 1;

    // Find unassigned problems, take next 4
    const { data: unassigned, error } = await supabase
      .from("l2_problems")
      .select("id")
      .is("week_number", null)
      .order("step_number", { ascending: true })
      .order("problem_order", { ascending: true })
      .limit(4);

    if (error) return { success: false, message: error.message };
    if (!unassigned || unassigned.length === 0) {
      return { success: false, message: "No unassigned problems left to assign." };
    }

    const ids = unassigned.map((p) => p.id);
    return await assignProblemsToWeek(ids, nextWeek);
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ==================== L2 SUBMISSIONS & RESULTS ====================

export async function hasUserCompletedL2Week(
  userId: number,
  weekNumber: number
): Promise<{ completed: boolean; result?: { problems_solved: number; total_problems: number; score: number } }> {
  try {
    const { data, error } = await supabase
      .from("l2_weekly_results")
      .select("problems_solved, total_problems, score")
      .eq("user_id", userId)
      .eq("week_number", weekNumber)
      .single();

    if (error && error.code === "PGRST116") return { completed: false };
    if (error) return { completed: false };
    return { completed: true, result: data };
  } catch {
    return { completed: false };
  }
}

export async function getUserL2Submissions(
  userId: number,
  weekNumber: number
): Promise<{ success: boolean; data?: any[] }> {
  try {
    const { data, error } = await supabase
      .from("l2_submissions")
      .select("problem_id, status, language, score, ai_score, ai_feedback, submitted_at")
      .eq("user_id", userId)
      .eq("week_number", weekNumber)
      .order("submitted_at", { ascending: false });

    if (error) return { success: false };
    return { success: true, data: data || [] };
  } catch {
    return { success: false };
  }
}

// Check if user has already attempted a specific problem (one-time attempt)
export async function hasUserAttemptedProblem(
  userId: number,
  problemId: number
): Promise<{ attempted: boolean; submission?: any }> {
  try {
    const { data, error } = await supabase
      .from("l2_submissions")
      .select("id, status, score, ai_score, ai_feedback, submitted_at")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") return { attempted: false };
    if (error) return { attempted: false };
    return { attempted: true, submission: data };
  } catch {
    return { attempted: false };
  }
}

// Get all attempted problem IDs for a user (across all weeks)
export async function getUserAttemptedProblems(
  userId: number
): Promise<{ success: boolean; attemptedMap: Record<number, { status: string; score: number; ai_score?: number }> }> {
  try {
    const { data, error } = await supabase
      .from("l2_submissions")
      .select("problem_id, status, score, ai_score")
      .eq("user_id", userId);

    if (error) return { success: false, attemptedMap: {} };

    const map: Record<number, { status: string; score: number; ai_score?: number }> = {};
    for (const s of data || []) {
      map[s.problem_id] = { status: s.status, score: s.score, ai_score: s.ai_score };
    }
    return { success: true, attemptedMap: map };
  } catch {
    return { success: false, attemptedMap: {} };
  }
}

export async function submitL2Solution(
  userId: number,
  problemId: number,
  weekNumber: number,
  code: string,
  language: string,
  timeExpired: boolean = false
): Promise<{
  success: boolean;
  message: string;
  results?: any;
  allPassed?: boolean;
  score?: number;
  aiScore?: number;
  aiFeedback?: string;
}> {
  try {
    // Check one-time attempt
    const { attempted } = await hasUserAttemptedProblem(userId, problemId);
    if (attempted) {
      return { success: false, message: "You have already attempted this problem. Only one attempt is allowed." };
    }

    // Get problem details
    const { data: problem, error: pErr } = await supabase
      .from("l2_problems")
      .select("title, description, test_cases")
      .eq("id", problemId)
      .single();

    if (pErr || !problem) {
      return { success: false, message: "Problem not found" };
    }

    const testCases: TestCase[] = problem.test_cases || [];
    if (testCases.length === 0) {
      return { success: false, message: "No test cases available for this problem" };
    }

    // Execute code against test cases FIRST
    const execResult = await runCodeAgainstTests(code, language, testCases);

    let finalScore = 0;
    let aiScore: number | undefined;
    let aiFeedback: string | undefined;
    let status: string;

    if (!execResult.success) {
      // Execution failed completely - use AI to score
      status = "error";
      if (code.trim()) {
        const aiResult = await scoreCodeWithAI(
          problem.title,
          problem.description,
          code,
          language,
          testCases.map((tc) => ({
            input: tc.input,
            expected: tc.expected_output,
            actual: "Execution Error",
            passed: false,
          }))
        );
        aiScore = aiResult.score;
        aiFeedback = aiResult.feedback;
        finalScore = aiScore;
      }
    } else if (execResult.allPassed) {
      // All test cases passed → 20 marks
      status = "passed";
      finalScore = MARKS_PER_PROBLEM;
    } else {
      // Some/all test cases failed → AI scores 0-15
      status = "failed";
      const aiResult = await scoreCodeWithAI(
        problem.title,
        problem.description,
        code,
        language,
        execResult.results.map((r) => ({
          input: r.input,
          expected: r.expected,
          actual: r.actual,
          passed: r.passed,
        }))
      );
      aiScore = aiResult.score;
      aiFeedback = aiResult.feedback;
      finalScore = aiScore;
    }

    // Save submission (one-time, unique constraint enforced)
    const { error: insertErr } = await supabase.from("l2_submissions").insert([{
      user_id: userId,
      problem_id: problemId,
      week_number: weekNumber,
      language,
      code,
      status,
      score: finalScore,
      ai_score: aiScore || null,
      ai_feedback: aiFeedback || null,
      test_results: execResult.success ? execResult.results : [],
      time_expired: timeExpired,
      submitted_at: new Date().toISOString(),
    }]);

    if (insertErr) {
      // Unique constraint violation = already attempted
      if (insertErr.code === "23505") {
        return { success: false, message: "You have already attempted this problem." };
      }
      return { success: false, message: insertErr.message };
    }

    // Update weekly results
    await updateL2WeeklyResults(userId, weekNumber);

    const scoreMsg = execResult.allPassed
      ? `All ${execResult.totalTests} test cases passed! Score: ${finalScore}/${MARKS_PER_PROBLEM}`
      : `${execResult.success ? execResult.totalPassed : 0}/${execResult.success ? execResult.totalTests : testCases.length} test cases passed. AI Score: ${aiScore ?? 0}/${MAX_AI_SCORE}`;

    return {
      success: true,
      message: scoreMsg,
      results: execResult.success ? execResult.results : [],
      allPassed: execResult.allPassed || false,
      score: finalScore,
      aiScore,
      aiFeedback,
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Submission failed" };
  }
}

async function updateL2WeeklyResults(userId: number, weekNumber: number) {
  try {
    // Get all problems for this week
    const { data: weekProblems } = await supabase
      .from("l2_problems")
      .select("id")
      .eq("week_number", weekNumber);

    if (!weekProblems || weekProblems.length === 0) return;

    const problemIds = weekProblems.map((p) => p.id);

    // Get all submissions for this user's week problems
    const { data: subs } = await supabase
      .from("l2_submissions")
      .select("problem_id, status, score")
      .eq("user_id", userId)
      .in("problem_id", problemIds);

    const subMap = new Map((subs || []).map((s) => [s.problem_id, s]));
    const problemsSolved = (subs || []).filter((s) => s.status === "passed").length;
    const totalScore = (subs || []).reduce((sum, s) => sum + (s.score || 0), 0);

    // Upsert weekly result
    const { data: existing } = await supabase
      .from("l2_weekly_results")
      .select("id")
      .eq("user_id", userId)
      .eq("week_number", weekNumber)
      .single();

    if (existing) {
      await supabase
        .from("l2_weekly_results")
        .update({
          problems_solved: problemsSolved,
          total_problems: problemIds.length,
          score: totalScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("l2_weekly_results").insert([{
        user_id: userId,
        week_number: weekNumber,
        problems_solved: problemsSolved,
        total_problems: problemIds.length,
        score: totalScore,
        completed_at: new Date().toISOString(),
      }]);
    }
  } catch {
    // Non-critical
  }
}

// ==================== L2 LEADERBOARD ====================

export async function getL2WeeklyLeaderboard(weekNumber: number): Promise<{
  success: boolean;
  data?: { roll_number: string; problems_solved: number; total_problems: number; score: number }[];
}> {
  try {
    const { data, error } = await supabase
      .from("l2_weekly_results")
      .select("problems_solved, total_problems, score, users:user_id(roll_number)")
      .eq("week_number", weekNumber)
      .order("score", { ascending: false });

    if (error) return { success: false };

    const formatted = (data || [])
      .filter((e: any) => e.users)
      .map((e: any) => ({
        roll_number: e.users.roll_number,
        problems_solved: e.problems_solved,
        total_problems: e.total_problems,
        score: e.score,
      }));

    return { success: true, data: formatted };
  } catch {
    return { success: false };
  }
}

export async function getL2CumulativeLeaderboard(): Promise<{
  success: boolean;
  data?: { roll_number: string; total_score: number; total_solved: number; weeks_completed: number }[];
}> {
  try {
    const { data, error } = await supabase
      .from("l2_weekly_results")
      .select("user_id, score, problems_solved, users:user_id(roll_number)");

    if (error) return { success: false };

    const userMap = new Map<number, { roll_number: string; total_score: number; total_solved: number; weeks: number }>();
    for (const entry of data || []) {
      const u = entry as any;
      if (!u.users) continue;
      if (!userMap.has(u.user_id)) {
        userMap.set(u.user_id, { roll_number: u.users.roll_number, total_score: 0, total_solved: 0, weeks: 0 });
      }
      const rec = userMap.get(u.user_id)!;
      rec.total_score += u.score;
      rec.total_solved += u.problems_solved;
      rec.weeks += 1;
    }

    const result = Array.from(userMap.values())
      .map((r) => ({
        roll_number: r.roll_number,
        total_score: r.total_score,
        total_solved: r.total_solved,
        weeks_completed: r.weeks,
      }))
      .sort((a, b) => b.total_score - a.total_score);

    return { success: true, data: result };
  } catch {
    return { success: false };
  }
}

export async function getUserL2History(userId: number): Promise<{
  success: boolean;
  data?: { week_number: number; problems_solved: number; total_problems: number; score: number; completed_at: string }[];
  totalScore?: number;
}> {
  try {
    const { data, error } = await supabase
      .from("l2_weekly_results")
      .select("week_number, problems_solved, total_problems, score, completed_at")
      .eq("user_id", userId)
      .order("week_number", { ascending: false });

    if (error) return { success: false };

    const totalScore = (data || []).reduce((sum, r) => sum + r.score, 0);
    return { success: true, data: data || [], totalScore };
  } catch {
    return { success: false };
  }
}

// ==================== L2 ADMIN ====================

export async function getL2CompletionStatus(weekNumber: number): Promise<{
  success: boolean;
  completed: { user_id: number; roll_number: string; problems_solved: number; score: number }[];
  pending: { user_id: number; roll_number: string }[];
}> {
  try {
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, roll_number")
      .order("roll_number");

    const { data: results } = await supabase
      .from("l2_weekly_results")
      .select("user_id, problems_solved, score")
      .eq("week_number", weekNumber);

    const completedMap = new Map((results || []).map((r) => [r.user_id, r]));

    const completed: any[] = [];
    const pending: any[] = [];

    for (const user of allUsers || []) {
      const result = completedMap.get(user.id);
      if (result) {
        completed.push({ user_id: user.id, roll_number: user.roll_number, problems_solved: result.problems_solved, score: result.score });
      } else {
        pending.push({ user_id: user.id, roll_number: user.roll_number });
      }
    }

    return { success: true, completed, pending };
  } catch {
    return { success: true, completed: [], pending: [] };
  }
}

export async function resetL2UsersForWeek(
  userIds: number[],
  weekNumber: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Delete weekly results
    await supabase
      .from("l2_weekly_results")
      .delete()
      .eq("week_number", weekNumber)
      .in("user_id", userIds);

    // Delete submissions
    await supabase
      .from("l2_submissions")
      .delete()
      .eq("week_number", weekNumber)
      .in("user_id", userIds);

    return { success: true, message: `Reset ${userIds.length} user(s) for L2 Week ${weekNumber}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ==================== L2 PROBLEM IMPORT ====================

export async function importL2Problems(
  problems: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    step_number: number;
    test_cases: { input: string; expected_output: string }[];
    starter_code?: { python?: string; java?: string; c?: string };
  }[]
): Promise<{ success: boolean; message: string; imported: number }> {
  try {
    let imported = 0;

    for (const p of problems) {
      const { error } = await supabase.from("l2_problems").insert([{
        title: p.title,
        description: p.description,
        category: p.category,
        difficulty: p.difficulty,
        step_number: p.step_number,
        test_cases: p.test_cases,
        starter_code: p.starter_code || getDefaultStarterCode(),
        problem_order: imported + 1,
      }]);

      if (!error) imported++;
    }

    return { success: true, message: `Imported ${imported}/${problems.length} problems`, imported };
  } catch (error: any) {
    return { success: false, message: error.message, imported: 0 };
  }
}

function getDefaultStarterCode() {
  return {
    python: `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    # Write your code here\n    pass\n\nsolve()`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your code here\n    }\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  };
}

// ==================== L2 PULLED WEEKS (ADMIN) ====================

export async function getL2PulledWeeks(): Promise<{ success: boolean; pulledWeeks: number[] }> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("l2_pulled_weeks")
      .eq("id", 1)
      .single();

    if (error) return { success: false, pulledWeeks: [] };
    return { success: true, pulledWeeks: data?.l2_pulled_weeks || [] };
  } catch {
    return { success: false, pulledWeeks: [] };
  }
}

export async function pullL2Week(weekNumber: number): Promise<{ success: boolean; message: string }> {
  try {
    const { week: currentWeek } = await getL2CurrentWeek();

    // Can only pull weeks < current week
    if (weekNumber >= currentWeek) {
      return { success: false, message: `Can only pull weeks before current week (${currentWeek})` };
    }

    const { pulledWeeks } = await getL2PulledWeeks();

    if (pulledWeeks.includes(weekNumber)) {
      return { success: false, message: `Week ${weekNumber} is already pulled` };
    }

    const updated = [...pulledWeeks, weekNumber].sort((a, b) => a - b);

    const { error } = await supabase
      .from("app_config")
      .update({ l2_pulled_weeks: updated, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) return { success: false, message: error.message };

    await supabase.from("admin_logs").insert([{
      action: "L2 Week Pulled",
      details: `Pulled Week ${weekNumber} into current assessment (Week ${currentWeek}).`,
      status: "Success",
    }]).then(() => {});

    return { success: true, message: `Week ${weekNumber} pulled! Students can now attempt those problems.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function unpullL2Week(weekNumber: number): Promise<{ success: boolean; message: string }> {
  try {
    const { pulledWeeks } = await getL2PulledWeeks();
    const updated = pulledWeeks.filter((w) => w !== weekNumber);

    const { error } = await supabase
      .from("app_config")
      .update({ l2_pulled_weeks: updated, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) return { success: false, message: error.message };
    return { success: true, message: `Week ${weekNumber} unpulled.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get all problems available to a student (current week + pulled weeks)
export async function getStudentAvailableProblems(weekNumber: number): Promise<{
  success: boolean;
  currentWeekProblems: any[];
  pulledWeekProblems: { week: number; problems: any[] }[];
}> {
  try {
    // Get current week problems
    const { data: currentProbs } = await supabase
      .from("l2_problems")
      .select("*")
      .eq("week_number", weekNumber)
      .order("problem_order", { ascending: true });

    // Get pulled weeks
    const { pulledWeeks } = await getL2PulledWeeks();

    const pulledWeekProblems: { week: number; problems: any[] }[] = [];

    for (const pw of pulledWeeks) {
      const { data: probs } = await supabase
        .from("l2_problems")
        .select("*")
        .eq("week_number", pw)
        .order("problem_order", { ascending: true });

      if (probs && probs.length > 0) {
        pulledWeekProblems.push({ week: pw, problems: probs });
      }
    }

    return {
      success: true,
      currentWeekProblems: currentProbs || [],
      pulledWeekProblems,
    };
  } catch {
    return { success: true, currentWeekProblems: [], pulledWeekProblems: [] };
  }
}
