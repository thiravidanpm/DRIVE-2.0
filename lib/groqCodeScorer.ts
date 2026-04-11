"use server";

/**
 * Groq AI Code Scorer
 * When test cases fail, uses Groq AI to evaluate code quality and assign 0-15 marks.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface AIScoreResult {
  score: number; // 0-15
  feedback: string;
}

export async function scoreCodeWithAI(
  problemTitle: string,
  problemDescription: string,
  code: string,
  language: string,
  testResults: { input: string; expected: string; actual: string; passed: boolean }[]
): Promise<AIScoreResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { score: 0, feedback: "AI scoring unavailable - API key not configured" };
  }

  const passedCount = testResults.filter((t) => t.passed).length;
  const totalCount = testResults.length;

  // Build a summary of test results (limit to avoid token overflow)
  const testSummary = testResults
    .slice(0, 5)
    .map(
      (t, i) =>
        `Test ${i + 1}: ${t.passed ? "PASSED" : "FAILED"}\n  Input: ${t.input.slice(0, 100)}\n  Expected: ${t.expected.slice(0, 100)}\n  Got: ${t.actual.slice(0, 100)}`
    )
    .join("\n");

  const prompt = `You are a strict code evaluator for a programming assessment platform.

PROBLEM: ${problemTitle}
${problemDescription.slice(0, 500)}

STUDENT'S CODE (${language}):
\`\`\`${language}
${code.slice(0, 2000)}
\`\`\`

TEST RESULTS: ${passedCount}/${totalCount} passed
${testSummary}

SCORING RULES:
- Maximum score is 15 marks (test cases failed, so they don't get full 20)
- Score based on:
  * Code logic correctness and approach (0-6 marks)
  * Partial correctness / how close to correct (0-5 marks)
  * Code quality, readability, proper structure (0-4 marks)
- If code is empty, trivial, or completely wrong: 0 marks
- If code shows good understanding but has bugs: 5-10 marks
- If code is nearly correct with minor issues: 10-15 marks

Respond with ONLY a JSON object (no markdown, no explanation):
{"score": <number 0-15>, "feedback": "<brief 1-2 sentence feedback>"}`;

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
              "You are a code evaluator. Respond with ONLY valid JSON, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
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
    const score = Math.max(0, Math.min(15, Math.round(Number(parsed.score) || 0)));
    const feedback = String(parsed.feedback || "No feedback provided").slice(0, 200);

    return { score, feedback };
  } catch {
    return { score: 0, feedback: "AI scoring failed - timeout or error" };
  }
}
