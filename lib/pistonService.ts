"use server";

// Piston API - Free code execution engine
// https://emkc.org/api/v2/piston
// Supports: Python 3.10, Java 15, C (GCC 10)

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

interface PistonRequest {
  language: string;
  version: string;
  files: { content: string }[];
  stdin?: string;
}

interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
  };
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  results: TestResult[];
  allPassed: boolean;
  totalPassed: number;
  totalTests: number;
  error?: string;
}

const LANGUAGE_CONFIG: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
};

// Execute code against a single test case
async function executeCode(
  code: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; error?: string }> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return { stdout: "", stderr: "", error: `Unsupported language: ${language}` };
  }

  const body: PistonRequest = {
    language: config.language,
    version: config.version,
    files: [{ content: code }],
    stdin,
  };

  try {
    const res = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30s timeout per execution
    });

    if (!res.ok) {
      const text = await res.text();
      return { stdout: "", stderr: "", error: `Execution API error (${res.status}): ${text}` };
    }

    const data: PistonResponse = await res.json();

    // Check for compilation errors (Java, C)
    if (data.compile && data.compile.code !== 0) {
      return {
        stdout: "",
        stderr: data.compile.stderr || data.compile.stdout || "Compilation failed",
        error: "Compilation Error",
      };
    }

    // Check for runtime errors
    if (data.run.code !== 0) {
      return {
        stdout: data.run.stdout || "",
        stderr: data.run.stderr || "Runtime error",
        error: data.run.signal ? `Signal: ${data.run.signal}` : "Runtime Error",
      };
    }

    return {
      stdout: data.run.stdout || "",
      stderr: data.run.stderr || "",
    };
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { stdout: "", stderr: "", error: "Time Limit Exceeded (30s)" };
    }
    return { stdout: "", stderr: "", error: err.message || "Execution failed" };
  }
}

// Run code against all test cases and return results
export async function runCodeAgainstTests(
  code: string,
  language: string,
  testCases: TestCase[]
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

  const results: TestResult[] = [];

  // Run test cases sequentially (to avoid rate limiting)
  for (const tc of testCases) {
    const { stdout, stderr, error } = await executeCode(code, language, tc.input);

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
  customInput: string
): Promise<{ success: boolean; output: string; error?: string }> {
  if (!code.trim()) {
    return { success: false, output: "", error: "No code provided" };
  }

  const { stdout, stderr, error } = await executeCode(code, language, customInput);

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
