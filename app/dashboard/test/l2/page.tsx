"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  getL2CurrentWeek,
  getL2WeekProblems,
  hasUserCompletedL2Week,
  getUserL2Submissions,
  getUserL2History,
  submitL2Solution,
} from "@/app/actions/l2";
import { quickRunCode } from "@/lib/pistonService";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Problem {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  test_cases: { input: string; expected_output: string }[];
  starter_code: { python?: string; java?: string; c?: string };
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

interface HistoryEntry {
  week_number: number;
  problems_solved: number;
  total_problems: number;
  score: number;
  completed_at: string;
}

type PageMode = "loading" | "completed" | "no-problems" | "menu" | "coding";

export default function L2TestPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<number>>(new Set());
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<HistoryEntry[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [completionResult, setCompletionResult] = useState<{
    problems_solved: number;
    total_problems: number;
    score: number;
  } | null>(null);
  const [mode, setMode] = useState<PageMode>("loading");

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"python" | "java" | "c">("python");
  const [customInput, setCustomInput] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanel, setActivePanel] = useState<"description" | "testcases" | "output">(
    "description"
  );

  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const autoSubmitRef = useRef(false);
  const MAX_VIOLATIONS = 3;

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }
    const uid = parseInt(storedUserId);
    setUserId(uid);
    loadData(uid);
  }, []);

  const loadData = async (uid: number) => {
    setMode("loading");
    const weekRes = await getL2CurrentWeek();
    const week = weekRes.week;
    setCurrentWeek(week);

    const completionRes = await hasUserCompletedL2Week(uid, week);
    const probRes = await getL2WeekProblems(week);

    if (probRes.success && probRes.data && probRes.data.length > 0) {
      setProblems(probRes.data);
    }

    const subsRes = await getUserL2Submissions(uid, week);
    if (subsRes.success && subsRes.data) {
      setSolvedProblemIds(new Set(subsRes.data.map((s: any) => s.problem_id)));
    }

    const histRes = await getUserL2History(uid);
    if (histRes.success && histRes.data) {
      setWeeklyHistory(histRes.data);
      setTotalScore(histRes.totalScore || 0);
    }

    if (
      completionRes.completed &&
      completionRes.result &&
      completionRes.result.problems_solved >= completionRes.result.total_problems
    ) {
      setCompletionResult(completionRes.result);
      setMode("completed");
      return;
    }

    if (!probRes.success || !probRes.data || probRes.data.length === 0) {
      setMode("no-problems");
    } else {
      setMode("menu");
    }
  };

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
    } catch {}
  }, []);

  const exitFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
    } catch {}
  }, []);

  const triggerAutoSubmit = useCallback(async () => {
    if (autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    exitFullscreen();
    setMode("menu");
    setSelectedProblem(null);
  }, [exitFullscreen]);

  useEffect(() => {
    if (mode !== "coding") return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((prev) => {
          const n = prev + 1;
          if (n >= MAX_VIOLATIONS) {
            setViolationMessage(
              `Violation ${n}/${MAX_VIOLATIONS}: Maximum violations! Returning to problem list.`
            );
            setShowViolationWarning(true);
            setTimeout(() => triggerAutoSubmit(), 2000);
          } else {
            setViolationMessage(
              `Violation ${n}/${MAX_VIOLATIONS}: Tab switch detected! ${MAX_VIOLATIONS - n} remaining.`
            );
            setShowViolationWarning(true);
          }
          return n;
        });
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mode === "coding" && !autoSubmitRef.current) {
        setViolations((prev) => {
          const n = prev + 1;
          if (n >= MAX_VIOLATIONS) {
            setViolationMessage(
              `Violation ${n}/${MAX_VIOLATIONS}: Maximum violations! Returning to problem list.`
            );
            setShowViolationWarning(true);
            setTimeout(() => triggerAutoSubmit(), 2000);
          } else {
            setViolationMessage(
              `Violation ${n}/${MAX_VIOLATIONS}: Fullscreen exited! ${MAX_VIOLATIONS - n} remaining.`
            );
            setShowViolationWarning(true);
            setTimeout(() => enterFullscreen(), 1500);
          }
          return n;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [mode, triggerAutoSubmit, enterFullscreen]);

  const openProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setCode(problem.starter_code?.[language] || "");
    setRunOutput("");
    setTestResults([]);
    setActivePanel("description");
    setViolations(0);
    setShowViolationWarning(false);
    autoSubmitRef.current = false;
    enterFullscreen();
    setMode("coding");
  };

  const handleLanguageChange = (lang: "python" | "java" | "c") => {
    setLanguage(lang);
    if (selectedProblem) setCode(selectedProblem.starter_code?.[lang] || "");
    setRunOutput("");
    setTestResults([]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActivePanel("output");
    setRunOutput("Running...");
    const result = await quickRunCode(code, language, customInput);
    setRunOutput(result.success ? result.output || "(no output)" : `Error: ${result.error}\n${result.output || ""}`);
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!userId || !selectedProblem) return;
    setIsSubmitting(true);
    setActivePanel("output");
    setRunOutput("Submitting & running test cases...");
    const result = await submitL2Solution(userId, selectedProblem.id, currentWeek, code, language);
    if (result.success) {
      setTestResults(result.results || []);
      setRunOutput(result.message || "");
      if (result.allPassed) {
        setSolvedProblemIds((prev) => new Set([...prev, selectedProblem.id]));
        const newSolvedCount =
          solvedProblemIds.size + (solvedProblemIds.has(selectedProblem.id) ? 0 : 1);
        if (newSolvedCount >= problems.length) {
          setTimeout(() => {
            exitFullscreen();
            setCompletionResult({
              problems_solved: problems.length,
              total_problems: problems.length,
              score: problems.length,
            });
            setMode("completed");
          }, 2000);
        }
      }
    } else {
      setRunOutput(`Error: ${result.message}`);
    }
    setIsSubmitting(false);
  };

  const goBackToMenu = () => {
    exitFullscreen();
    setSelectedProblem(null);
    setTestResults([]);
    setRunOutput("");
    setMode("menu");
  };

  const monacoLangMap: Record<string, string> = { python: "python", java: "java", c: "c" };

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading L2 Coding Assessment...</p>
        </div>
      </div>
    );
  }

  if (mode === "no-problems") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-12 text-center max-w-md border border-gray-700">
          <p className="text-6xl mb-4">💻</p>
          <h1 className="text-2xl font-bold text-white mb-4">L2 Week {currentWeek}</h1>
          <p className="text-gray-400 mb-6">
            No coding problems assigned for this week yet. The admin needs to assign problems.
          </p>
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (mode === "completed") {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">L2 Coding - Week {currentWeek}</h1>
              <p className="text-gray-400 text-sm">DSA Problem Solving</p>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                Dashboard
              </button>
            </Link>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-gray-800 border border-green-500/30 rounded-xl p-10 text-center mb-8">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-3xl font-bold text-green-400 mb-3">Week {currentWeek} Complete!</h2>
            <p className="text-gray-400 mb-6">All coding problems solved. Come back next week!</p>
            {completionResult && (
              <div className="inline-block bg-gray-900 rounded-xl p-6 mb-6">
                <p className="text-5xl font-black text-green-400">
                  {completionResult.problems_solved}/{completionResult.total_problems}
                </p>
                <p className="text-gray-500 text-sm mt-2">Problems Solved</p>
              </div>
            )}
          </div>
          {weeklyHistory.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Weekly History</h3>
              <div className="space-y-3">
                {weeklyHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-white">Week {entry.week_number}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-green-400">
                      {entry.problems_solved}/{entry.total_problems}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between items-center bg-green-900/30 rounded-lg p-4 border border-green-700 font-bold">
                  <p className="text-green-400">Total Score</p>
                  <p className="text-2xl text-green-400">{totalScore}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">L2 Coding - Week {currentWeek}</h1>
              <p className="text-gray-400 text-sm">
                {solvedProblemIds.size}/{problems.length} solved
              </p>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                Dashboard
              </button>
            </Link>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
            <p className="text-amber-300 text-sm">
              <strong>⚠️ Rules:</strong> Fullscreen mode enforced. Tab switch / exit fullscreen =
              violation. 3 violations = kicked out of the problem.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">This Week&apos;s Problems</h2>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${(solvedProblemIds.size / Math.max(problems.length, 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-green-400 font-bold text-sm">
                  {solvedProblemIds.size}/{problems.length}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {problems.map((problem, idx) => {
              const isSolved = solvedProblemIds.has(problem.id);
              return (
                <div
                  key={problem.id}
                  className={`bg-gray-800 rounded-xl border p-5 cursor-pointer transition hover:border-green-500/50 ${isSolved ? "border-green-600/40" : "border-gray-700"}`}
                  onClick={() => openProblem(problem)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isSolved ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`}
                      >
                        {isSolved ? "✓" : idx + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                            {problem.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${problem.difficulty === "Easy" ? "bg-green-900 text-green-300" : problem.difficulty === "Medium" ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300"}`}
                          >
                            {problem.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-lg font-bold text-sm ${isSolved ? "bg-green-900/50 text-green-400 border border-green-700" : "bg-blue-900/50 text-blue-400 border border-blue-700"}`}
                    >
                      {isSolved ? "Solved ✓" : "Solve →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {weeklyHistory.length > 0 && (
            <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">📈 Weekly History</h3>
              <div className="space-y-2">
                {weeklyHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-900 rounded-lg p-3 border border-gray-700"
                  >
                    <span className="text-gray-300">Week {entry.week_number}</span>
                    <span className="text-green-400 font-bold">
                      {entry.problems_solved}/{entry.total_problems}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center bg-green-900/20 rounded-lg p-3 border border-green-800 font-bold">
                  <span className="text-green-300">Total</span>
                  <span className="text-green-400 text-lg">{totalScore}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "coding" && selectedProblem) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden relative">
        {showViolationWarning && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl border border-red-500 p-8 max-w-md w-full text-center">
              <p className="text-5xl mb-4">⚠️</p>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Warning!</h2>
              <p className="text-gray-300 mb-6">{violationMessage}</p>
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: MAX_VIOLATIONS }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${i < violations ? "bg-red-500" : "bg-gray-600"}`}
                  />
                ))}
              </div>
              {violations < MAX_VIOLATIONS ? (
                <button
                  onClick={() => setShowViolationWarning(false)}
                  className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                >
                  Continue Coding
                </button>
              ) : (
                <p className="text-red-400 font-bold animate-pulse">
                  Returning to problem list...
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={goBackToMenu}
              className="text-gray-400 hover:text-white transition text-sm"
            >
              ← Back
            </button>
            <h1 className="text-white font-semibold truncate max-w-md">
              {selectedProblem.title}
            </h1>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold ${selectedProblem.difficulty === "Easy" ? "bg-green-900 text-green-300" : selectedProblem.difficulty === "Medium" ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300"}`}
            >
              {selectedProblem.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as "python" | "java" | "c")}
              className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 border border-gray-600"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_VIOLATIONS }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < violations ? "bg-red-500" : "bg-green-500"}`}
                />
              ))}
            </div>
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="px-4 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50 transition border border-gray-600"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Judging..." : "Submit"}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[45%] border-r border-gray-700 flex flex-col">
            <div className="flex border-b border-gray-700 bg-gray-800">
              {(["description", "testcases", "output"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivePanel(tab)}
                  className={`px-4 py-2 text-sm font-medium transition ${activePanel === tab ? "text-white border-b-2 border-green-500" : "text-gray-400 hover:text-gray-200"}`}
                >
                  {tab === "description" && "📄 Problem"}
                  {tab === "testcases" && `🧪 Tests (${selectedProblem.test_cases.length})`}
                  {tab === "output" && "📤 Output"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activePanel === "description" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">{selectedProblem.title}</h2>
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans leading-relaxed bg-gray-800 p-4 rounded-lg border border-gray-700">
                    {selectedProblem.description}
                  </pre>
                  <h3 className="text-lg font-semibold text-white mt-6 mb-3">Examples</h3>
                  {selectedProblem.test_cases.slice(0, 2).map((tc, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-3"
                    >
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-500">Input:</span>
                        <pre className="text-green-300 text-sm mt-1 bg-gray-900 p-2 rounded">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500">Output:</span>
                        <pre className="text-green-300 text-sm mt-1 bg-gray-900 p-2 rounded">
                          {tc.expected_output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activePanel === "testcases" && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white mb-2">Test Cases</h3>
                  {selectedProblem.test_cases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-4"
                    >
                      <p className="text-xs font-bold text-gray-500 mb-2">
                        Test Case {idx + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500">Input:</span>
                          <pre className="text-gray-300 text-sm mt-1 bg-gray-900 p-2 rounded">
                            {tc.input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Expected:</span>
                          <pre className="text-green-300 text-sm mt-1 bg-gray-900 p-2 rounded">
                            {tc.expected_output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-400 block mb-2">
                      Custom Input (for Run):
                    </label>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full h-24 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg p-3 font-mono text-sm resize-none"
                      placeholder="Enter custom input here..."
                    />
                  </div>
                </div>
              )}
              {activePanel === "output" && (
                <div>
                  {runOutput && (
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Output</h3>
                      <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono">
                        {runOutput}
                      </pre>
                    </div>
                  )}
                  {testResults.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 mb-3">Test Results</h3>
                      <div className="space-y-2">
                        {testResults.map((r, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg border p-3 ${r.passed ? "bg-green-900/20 border-green-700" : "bg-red-900/20 border-red-700"}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-white">
                                {r.passed ? "✅" : "❌"} Test {idx + 1}
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${r.passed ? "bg-green-800 text-green-300" : "bg-red-800 text-red-300"}`}
                              >
                                {r.passed ? "PASSED" : r.error || "WRONG ANSWER"}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500 block">Input:</span>
                                <pre className="text-gray-300 mt-0.5 bg-gray-900 p-1.5 rounded truncate">
                                  {r.input}
                                </pre>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Expected:</span>
                                <pre className="text-green-300 mt-0.5 bg-gray-900 p-1.5 rounded truncate">
                                  {r.expected}
                                </pre>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Got:</span>
                                <pre
                                  className={`mt-0.5 bg-gray-900 p-1.5 rounded truncate ${r.passed ? "text-green-300" : "text-red-300"}`}
                                >
                                  {r.actual}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!runOutput && testResults.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Run your code or submit to see output here.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-gray-900">
            <MonacoEditor
              height="100%"
              language={monacoLangMap[language]}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 12 },
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
