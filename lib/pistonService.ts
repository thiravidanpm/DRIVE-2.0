"use server";

// Judge0 CE API - Free code execution engine
// Using public instance at judge0-ce.p.sulu.sh (free, no API key)
// Supports: Python 3, Java, C (GCC)

const JUDGE0_URL = process.env.JUDGE0_URL || "https://judge0-ce.p.sulu.sh";

interface TestCase {
  input: string;
  expected_output: string;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

interface ExecutionResult {
  success: boolean;
  results: TestResult[];
  allPassed: boolean;
  totalPassed: number;
  totalTests: number;
  error?: string;
}

export type { TestCase, TestResult, ExecutionResult };

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  python: 71,  // Python 3.8.1
  java: 62,    // Java (OpenJDK 13.0.1)
  c: 50,       // C (GCC 9.2.0)
};

// Submit code and wait for result
async function executeCode(
  code: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; error?: string }> {
  const langId = LANGUAGE_IDS[language];
  if (!langId) {
    return { stdout: "", stderr: "", error: `Unsupported language: ${language}` };
  }

  try {
    // Submit with wait=true (synchronous, blocks until result)
    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: langId,
        source_code: Buffer.from(code).toString("base64"),
        stdin: Buffer.from(stdin).toString("base64"),
        cpu_time_limit: 10,
        memory_limit: 128000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text();
      // If synchronous mode fails, try async polling
      if (submitRes.status === 429) {
        return { stdout: "", stderr: "", error: "Rate limited. Please wait a moment and try again." };
      }
      return { stdout: "", stderr: "", error: `Execution API error (${submitRes.status}): ${text}` };
    }

    const data = await submitRes.json();

    // Decode base64 outputs
    const stdout = data.stdout ? Buffer.from(data.stdout, "base64").toString() : "";
    const stderr = data.stderr ? Buffer.from(data.stderr, "base64").toString() : "";
    const compileOutput = data.compile_output ? Buffer.from(data.compile_output, "base64").toString() : "";

    // Status IDs: 1=Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compilation Error, etc.
    const statusId = data.status?.id;

    if (statusId === 6) {
      return {
        stdout: "",
        stderr: compileOutput || "Compilation failed",
        error: "Compilation Error",
      };
    }

    if (statusId === 5) {
      return { stdout: "", stderr: "", error: "Time Limit Exceeded" };
    }

    if (statusId === 7 || statusId === 8 || statusId === 9 || statusId === 10 || statusId === 12) {
      // 7=MLE, 8-10=Runtime errors, 12=Output limit
      return {
        stdout,
        stderr: stderr || data.status?.description || "Runtime error",
        error: data.status?.description || "Runtime Error",
      };
    }

    if (statusId === 11) {
      return { stdout: "", stderr: "", error: "Internal error. Try again." };
    }

    // Status 3 (Accepted) or 4 (Wrong Answer) - both have output
    return { stdout, stderr };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { stdout: "", stderr: "", error: "Time Limit Exceeded (30s)" };
    }
    return { stdout: "", stderr: "", error: err.message || "Execution failed" };
  }
}

// Wrap student's solution code with driver code
function wrapCode(code: string, driverCode?: string): string {
  if (!driverCode) return code;
  return driverCode.replace("{{SOLUTION}}", code);
}

// Run code against all test cases and return results
export async function runCodeAgainstTests(
  code: string,
  language: string,
  testCases: TestCase[],
  driverCode?: string
): Promise<ExecutionResult> {
  if (!code.trim()) {
    return {
      success: false,
      results: [],
      allPassed: false,
      totalPassed: 0,
      totalTests: testCases.length,
      error: "No code provided",
    };
  }

  if (testCases.length === 0) {
    return {
      success: false,
      results: [],
      allPassed: false,
      totalPassed: 0,
      totalTests: 0,
      error: "No test cases available for this problem",
    };
  }

  const finalCode = wrapCode(code, driverCode);
  const results: TestResult[] = [];

  // Run test cases sequentially (to avoid rate limiting)
  for (const tc of testCases) {
    const { stdout, stderr, error } = await executeCode(finalCode, language, tc.input);

    const actualOutput = stdout.trim();
    const expectedOutput = tc.expected_output.trim();
    const passed = !error && actualOutput === expectedOutput;

    results.push({
      passed,
      input: tc.input,
      expected: expectedOutput,
      actual: error ? `Error: ${error}${stderr ? `\n${stderr}` : ""}` : actualOutput,
      error: error || undefined,
    });

    // If compilation error, all subsequent tests will fail the same way
    if (error === "Compilation Error") {
      for (let i = results.length; i < testCases.length; i++) {
        results.push({
          passed: false,
          input: testCases[i].input,
          expected: testCases[i].expected_output.trim(),
          actual: `Compilation Error: ${stderr}`,
          error: "Compilation Error",
        });
      }
      break;
    }
  }

  const totalPassed = results.filter((r) => r.passed).length;

  return {
    success: true,
    results,
    allPassed: totalPassed === testCases.length,
    totalPassed,
    totalTests: testCases.length,
  };
}

// Quick run - execute code with custom input (for "Run" button, not submit)
export async function quickRunCode(
  code: string,
  language: string,
  customInput: string,
  driverCode?: string
): Promise<{ success: boolean; output: string; error?: string }> {
  if (!code.trim()) {
    return { success: false, output: "", error: "No code provided" };
  }

  const finalCode = wrapCode(code, driverCode);
  const { stdout, stderr, error } = await executeCode(finalCode, language, customInput);

  if (error) {
    return {
      success: false,
      output: stderr || "",
      error,
    };
  }

  return {
    success: true,
    output: stdout,
  };
}
