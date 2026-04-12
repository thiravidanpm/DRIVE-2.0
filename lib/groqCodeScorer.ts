"use server";

/**
 * Groq AI Code Scorer
 * Primary scoring engine for L2 coding assessment.
 * Evaluates pasted code solutions against LeetCode problems.
 * Score: 0-20 marks.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface AIScoreResult {
  score: number; // 0-20
  feedback: string;
}

/**
 * Primary scorer: Evaluate a code solution for a LeetCode problem.
 * No test case execution — pure AI evaluation.
 * Score: 0-20 marks.
 */
export async function evaluateCodeSolution(
  problemTitle: string,
  problemDescription: string,
  code: string,
  language: string
): Promise<AIScoreResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { score: 0, feedback: "AI scoring unavailable - API key not configured" };
  }

  if (!code.trim() || code.trim().length < 10) {
    return { score: 0, feedback: "No meaningful code submitted." };
  }

  const prompt = `PROBLEM TITLE: ${problemTitle}

PROBLEM DESCRIPTION:
${problemDescription.slice(0, 1000)}

STUDENT'S SUBMITTED CODE (${language}):
\`\`\`${language}
${code.slice(0, 3000)}
\`\`\`

=== YOUR TASK ===

You MUST carefully analyze the code step by step BEFORE scoring.

STEP 1 — SYNTAX CHECK:
- Read every line. Are there syntax errors? Missing brackets, wrong operators, typos in keywords, unclosed strings, missing colons, semicolons, wrong indentation?
- If there are syntax errors, the code CANNOT run. Correctness score MUST be 0-3 max.

STEP 2 — DRY RUN (MENTAL EXECUTION):
- Mentally execute the code with a simple test case from the problem.
- Trace variables step by step. What does each line do? What value does each variable hold?
- Does the function return the correct answer for that test case?
- Now try an edge case (empty input, single element, all same values, negative numbers, large input).
- If the code produces wrong output for ANY standard test case, it is NOT fully correct.

STEP 3 — LOGIC ERRORS CHECK:
- Off-by-one errors (wrong loop bounds, < vs <=, indexing from 0 vs 1)
- Wrong comparison operators (< instead of >, == instead of !=)
- Wrong variable used (using i instead of j, returning wrong variable)
- Missing return statement or returning wrong type
- Infinite loops or unreachable code
- Wrong data structure usage
- Hardcoded values that only work for one test case
- Logic that doesn't match the problem requirements

STEP 4 — RELEVANCE CHECK:
- Does the code actually solve THIS specific problem, not some other problem?
- Is it just a template/boilerplate with no real logic?
- Is it copied placeholder code like "pass", "return 0", "return None", "return null"?

STEP 5 — SCORING (Total: 20 marks):

A. CORRECTNESS (0-10 marks) — THIS IS THE MOST IMPORTANT CATEGORY:
   - 0 = won't compile/run, syntax errors, or completely wrong solution
   - 1-2 = has the right idea but major bugs prevent it from working
   - 3-4 = works for trivial case but fails on most inputs
   - 5-6 = works for some inputs but has clear logical bugs
   - 7-8 = mostly works but fails edge cases
   - 9 = correct for all standard cases, might miss rare edge cases
   - 10 = fully correct, handles all edge cases

B. ALGORITHM & APPROACH (0-5 marks):
   - 0 = no real algorithm or completely wrong approach
   - 1-2 = brute force or very inefficient
   - 3 = correct approach but not optimal
   - 4-5 = optimal or near-optimal time/space complexity

C. CODE QUALITY (0-5 marks):
   - 0-1 = unreadable, terrible naming
   - 2-3 = average readability
   - 4-5 = clean, well-structured, good naming

HARD RULES (VIOLATIONS = AUTOMATIC SCORE):
- Empty code, only comments, or < 2 lines of logic → score: 0
- Only function signature with "pass"/"return 0"/"return null"/no body → score: 0
- Code for a DIFFERENT problem than "${problemTitle}" → score: 0
- Has syntax errors that prevent compilation → score: 0-5 max (0 for correctness, up to 5 for approach+quality IF the logic idea was right)
- Has a runtime error on standard input (null pointer, index out of bounds, division by zero) → max correctness: 4
- Produces wrong output on the basic example from the problem description → max correctness: 5
- Hardcodes output instead of computing it → score: 0-2

DO NOT BE GENEROUS. Most student code has bugs. If you find even ONE bug that causes wrong output, correctness cannot be 9 or 10.

Respond with ONLY a valid JSON object, no markdown formatting, no backticks:
{"score": <0-20>, "feedback": "<1-2 sentences explaining specific bugs found or why the score was given>"}`;

  try {
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
            content:
              "You are a STRICT code evaluator and bug detector. Your job is to find errors in student code. You MUST mentally execute the code line by line before scoring. If the code has ANY syntax error, logic bug, wrong output, or runtime error — you MUST penalize heavily. Never assume code is correct without tracing it. Students often submit buggy code — your job is to catch every bug. Respond with ONLY valid JSON, no markdown.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { score: 0, feedback: "AI scoring failed - API error" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { score: 0, feedback: "AI scoring failed - invalid response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    let score = Math.max(0, Math.min(20, Math.round(Number(parsed.score) || 0)));
    let feedback = String(parsed.feedback || "No feedback provided").slice(0, 300);

    // === POST-SCORE GUARDRAILS ===
    score = applyGuardrails(code, language, score, feedback);

    return { score, feedback };
  } catch {
    return { score: 0, feedback: "AI scoring failed - timeout or error" };
  }
}

/**
 * Post-AI guardrails: catch obvious issues the AI may have missed.
 * Caps the score if code patterns indicate bugs.
 */
function applyGuardrails(code: string, language: string, score: number, feedback: string): number {
  const trimmed = code.trim();
  const lines = trimmed.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("#") && !l.trim().startsWith("/*") && !l.trim().startsWith("*"));

  // G1: Too little real code — cap at 3
  if (lines.length < 3) {
    return Math.min(score, 3);
  }

  // G2: Only function signature with pass/return None/return 0 — cap at 2
  const codeNoComments = lines.join("\n").toLowerCase();
  if (
    (codeNoComments.includes("pass") && lines.length <= 3) ||
    (lines.length <= 3 && /return\s*(none|null|0|false|\[\]|\{\}|""|'')\s*;?\s*$/.test(codeNoComments))
  ) {
    return Math.min(score, 2);
  }

  // G3: Detect syntax errors — unmatched brackets/parens
  const opens = (trimmed.match(/[({[]/g) || []).length;
  const closes = (trimmed.match(/[)}\]]/g) || []).length;
  if (Math.abs(opens - closes) >= 2) {
    return Math.min(score, 8);
  }

  // G4: Python-specific — detect obvious IndentationError patterns
  if (language === "python") {
    const hasDefOrClass = /^(def |class )/m.test(trimmed);
    const hasIndentedBody = /^ {2,}|\t/m.test(trimmed);
    if (hasDefOrClass && !hasIndentedBody) {
      return Math.min(score, 5);
    }
  }

  // G5: Java/C/C++ — missing main function body or class structure
  if ((language === "java" || language === "c" || language === "cpp") && lines.length > 5) {
    const hasSemicolons = (trimmed.match(/;/g) || []).length;
    if (hasSemicolons === 0) {
      return Math.min(score, 5);
    }
  }

  // G6: Detect hardcoded return — a function that only returns a literal
  if (/^(def|function|public|private|static|int|void|class)\s/.test(trimmed) && lines.length <= 4) {
    const hasOnlyReturn = lines.filter((l) => /return\s+\d+|return\s+"/.test(l.trim())).length > 0;
    const hasNoLogic = !trimmed.includes("for") && !trimmed.includes("while") && !trimmed.includes("if");
    if (hasOnlyReturn && hasNoLogic) {
      return Math.min(score, 3);
    }
  }

  return score;
}
