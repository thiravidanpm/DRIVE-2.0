"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  getL2CurrentWeek,
  getStudentAvailableProblems,
  getUserAttemptedProblems,
  getUserL2History,
  submitL2Solution,
} from "@/app/actions/l2";
import { quickRunCode } from "@/lib/pistonService";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const TIMER_SECONDS = 10 * 60; // 10 minutes

interface Problem {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  week_number: number;
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

interface AttemptInfo {
  status: string;
  score: number;
  ai_score?: number;
}

type PageMode = "loading" | "no-problems" | "menu" | "coding";

export default function L2TestPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentWeekProblems, setCurrentWeekProblems] = useState<Problem[]>([]);
  const [pulledWeekProblems, setPulledWeekProblems] = useState<{ week: number; problems: Problem[] }[]>([]);
  const [attemptedMap, setAttemptedMap] = useState<Record<number, AttemptInfo>>({});
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [selectedProblemWeek, setSelectedProblemWeek] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState<HistoryEntry[]>([]);
  const [totalScore, setTotalScore] = useState(0);
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
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    aiScore?: number;
    aiFeedback?: string;
    allPassed: boolean;
  } | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  // Violations
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
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

    const [probRes, attRes, histRes] = await Promise.all([
      getStudentAvailableProblems(week),
      getUserAttemptedProblems(uid),
      getUserL2History(uid),
    ]);

    if (probRes.success) {
      setCurrentWeekProblems(probRes.currentWeekProblems);
      setPulledWeekProblems(probRes.pulledWeekProblems);
    }

    if (attRes.success) {
      setAttemptedMap(attRes.attemptedMap);
    }

    if (histRes.success && histRes.data) {
      setWeeklyHistory(histRes.data);
      setTotalScore(histRes.totalScore || 0);
    }

    const hasProblems =
      (probRes.currentWeekProblems?.length || 0) > 0 ||
      (probRes.pulledWeekProblems?.length || 0) > 0;

    setMode(hasProblems ? "menu" : "no-problems");
  };

  // Timer countdown
  useEffect(() => {
    if (mode !== "coding") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            autoSubmitRef.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const handleAutoSubmit = async () => {
    if (!userId || !selectedProblem) return;
    setIsSubmitting(true);
    setActivePanel("output");
    setRunOutput("⏰ Time expired! Auto-submitting your code...");

    const result = await submitL2Solution(
      userId,
      selectedProblem.id,
      selectedProblemWeek,
      code,
      language,
      true
    );

    if (result.success) {
      setTestResults(result.results || []);
      setRunOutput(result.message || "");
      setSubmissionResult({
        score: result.score || 0,
        aiScore: result.aiScore,
        aiFeedback: result.aiFeedback,
        allPassed: result.allPassed || false,
      });
      setAttemptedMap((prev) => ({
        ...prev,
        [selectedProblem.id]: {
          status: result.allPassed ? "passed" : "failed",
          score: result.score || 0,
          ai_score: result.aiScore,
        },
      }));
    } else {
      setRunOutput(`Error: ${result.message}`);
    }
    setIsSubmitting(false);
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
              `Violation ${n}/${MAX_VIOLATIONS}: Maximum violations! Auto-submitting.`
            );
            setShowViolationWarning(true);
            setTimeout(() => {
              if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                handleAutoSubmit();
              }
              setTimeout(() => triggerAutoSubmit(), 3000);
            }, 2000);
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
              `Violation ${n}/${MAX_VIOLATIONS}: Maximum violations! Auto-submitting.`
            );
            setShowViolationWarning(true);
            setTimeout(() => {
              if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                handleAutoSubmit();
              }
              setTimeout(() => triggerAutoSubmit(), 3000);
            }, 2000);
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
  }, [mode, triggerAutoSubmit, enterFullscreen]);

  const openProblem = (problem: Problem, weekNum: number) => {
    // Check if already attempted
    if (attemptedMap[problem.id]) return;

    setSelectedProblem(problem);
    setSelectedProblemWeek(weekNum);
    setCode(problem.starter_code?.[language] || "");
    setRunOutput("");
    setTestResults([]);
    setSubmissionResult(null);
    setActivePanel("description");
    setViolations(0);
    setShowViolationWarning(false);
    autoSubmitRef.current = false;
    hasSubmittedRef.current = false;
    setTimeLeft(TIMER_SECONDS);
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
    if (!userId || !selectedProblem || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setActivePanel("output");
    setRunOutput("Submitting & running test cases... (AI scoring if tests fail)");

    const result = await submitL2Solution(
      userId,
      selectedProblem.id,
      selectedProblemWeek,
      code,
      language,
      false
    );

    if (result.success) {
      setTestResults(result.results || []);
      setRunOutput(result.message || "");
      setSubmissionResult({
        score: result.score || 0,
        aiScore: result.aiScore,
        aiFeedback: result.aiFeedback,
        allPassed: result.allPassed || false,
      });
      setAttemptedMap((prev) => ({
        ...prev,
        [selectedProblem.id]: {
          status: result.allPassed ? "passed" : "failed",
          score: result.score || 0,
          ai_score: result.aiScore,
        },
      }));
      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setRunOutput(`Error: ${result.message}`);
      // Allow re-submit if it was a transient error (not "already attempted")
      if (!result.message?.includes("already attempted")) {
        hasSubmittedRef.current = false;
      }
    }
    setIsSubmitting(false);
  };

  const goBackToMenu = () => {
    exitFullscreen();
    setSelectedProblem(null);
    setTestResults([]);
    setRunOutput("");
    setSubmissionResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode("menu");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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

  if (mode === "menu") {
    const allProblems = [
      ...currentWeekProblems.map((p) => ({ ...p, fromWeek: currentWeek, isCurrent: true })),
      ...pulledWeekProblems.flatMap((pw) =>
        pw.problems.map((p) => ({ ...p, fromWeek: pw.week, isCurrent: false }))
      ),
    ];
    const attemptedCount = allProblems.filter((p) => attemptedMap[p.id]).length;
    const totalMarks = allProblems.reduce((sum, p) => sum + (attemptedMap[p.id]?.score || 0), 0);
    const maxPossible = allProblems.length * 20;

    return (
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">L2 Coding - Week {currentWeek}</h1>
              <p className="text-gray-400 text-sm">
                {attemptedCount}/{allProblems.length} attempted • {totalMarks}/{maxPossible} marks
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
              <strong>⚠️ Rules:</strong> 10-minute timer per problem. One attempt only — no retries.
              Fullscreen enforced. 3 violations = auto-submit. Score: Pass all tests = 20 marks, Fail = AI scores 0-15.
            </p>
          </div>

          {/* Score summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
              <p className="text-3xl font-black text-green-400">{totalMarks}</p>
              <p className="text-xs text-gray-500 mt-1">Total Marks</p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
              <p className="text-3xl font-black text-blue-400">{attemptedCount}/{allProblems.length}</p>
              <p className="text-xs text-gray-500 mt-1">Attempted</p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
              <p className="text-3xl font-black text-purple-400">{allProblems.filter((p) => attemptedMap[p.id]?.status === "passed").length}</p>
              <p className="text-xs text-gray-500 mt-1">Passed</p>
            </div>
          </div>

          {/* Current Week Problems */}
          {currentWeekProblems.length > 0 && (
            <div className="mb-8">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-3">
                <h2 className="text-lg font-bold text-white">Week {currentWeek} Problems</h2>
              </div>
              <div className="space-y-3">
                {currentWeekProblems.map((problem, idx) => {
                  const attempt = attemptedMap[problem.id];
                  return (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      index={idx}
                      attempt={attempt}
                      onClick={() => openProblem(problem, currentWeek)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pulled Week Problems */}
          {pulledWeekProblems.map((pw) => (
            <div key={pw.week} className="mb-8">
              <div className="bg-gray-800 rounded-xl border border-purple-700/40 p-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-300 font-semibold">PULLED</span>
                  <h2 className="text-lg font-bold text-white">Week {pw.week} Problems</h2>
                </div>
              </div>
              <div className="space-y-3">
                {pw.problems.map((problem, idx) => {
                  const attempt = attemptedMap[problem.id];
                  return (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      index={idx}
                      attempt={attempt}
                      onClick={() => openProblem(problem, pw.week)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {weeklyHistory.length > 0 && (
            <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Weekly History</h3>
              <div className="space-y-2">
                {weeklyHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-900 rounded-lg p-3 border border-gray-700"
                  >
                    <span className="text-gray-300">Week {entry.week_number}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm">
                        {entry.problems_solved}/{entry.total_problems} solved
                      </span>
                      <span className="text-green-400 font-bold">{entry.score} pts</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center bg-green-900/20 rounded-lg p-3 border border-green-800 font-bold">
                  <span className="text-green-300">Total Score</span>
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
    const timerColor = timeLeft <= 60 ? "text-red-400" : timeLeft <= 180 ? "text-yellow-400" : "text-green-400";

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
                  Auto-submitting & returning to problem list...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submission Result Modal */}
        {submissionResult && (
          <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
            <div className={`bg-gray-800 rounded-xl border ${submissionResult.allPassed ? "border-green-500" : "border-yellow-500"} p-8 max-w-md w-full text-center`}>
              <p className="text-5xl mb-4">{submissionResult.allPassed ? "🎉" : "📝"}</p>
              <h2 className={`text-2xl font-bold mb-3 ${submissionResult.allPassed ? "text-green-400" : "text-yellow-400"}`}>
                {submissionResult.allPassed ? "All Tests Passed!" : "Submission Scored"}
              </h2>
              <div className="bg-gray-900 rounded-xl p-6 mb-4">
                <p className={`text-5xl font-black ${submissionResult.allPassed ? "text-green-400" : "text-yellow-400"}`}>
                  {submissionResult.score}/20
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {submissionResult.allPassed
                    ? "Full marks — all test cases passed"
                    : `AI Score: ${submissionResult.aiScore ?? 0}/15`}
                </p>
              </div>
              {submissionResult.aiFeedback && (
                <p className="text-gray-400 text-sm mb-4 italic">
                  &quot;{submissionResult.aiFeedback}&quot;
                </p>
              )}
              <button
                onClick={goBackToMenu}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Back to Problems
              </button>
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
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-300 font-semibold">
              20 marks
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 border ${timeLeft <= 60 ? "border-red-500 animate-pulse" : "border-gray-600"}`}>
              <span className="text-xs text-gray-400">⏱</span>
              <span className={`font-mono font-bold text-sm ${timerColor}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
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
              disabled={isRunning || isSubmitting || hasSubmittedRef.current}
              className="px-4 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50 transition border border-gray-600"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting || hasSubmittedRef.current}
              className="px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Judging..." : hasSubmittedRef.current ? "Submitted" : "Submit"}
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

// Problem card sub-component
function ProblemCard({
  problem,
  index,
  attempt,
  onClick,
}: {
  problem: Problem;
  index: number;
  attempt?: AttemptInfo;
  onClick: () => void;
}) {
  const isAttempted = !!attempt;
  const isPassed = attempt?.status === "passed";

  return (
    <div
      className={`bg-gray-800 rounded-xl border p-5 transition ${
        isAttempted
          ? isPassed
            ? "border-green-600/40 cursor-default"
            : "border-yellow-600/40 cursor-default"
          : "border-gray-700 cursor-pointer hover:border-green-500/50"
      }`}
      onClick={isAttempted ? undefined : onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              isPassed
                ? "bg-green-600 text-white"
                : isAttempted
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300"
            }`}
          >
            {isPassed ? "✓" : isAttempted ? "!" : index + 1}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                {problem.category}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  problem.difficulty === "Easy"
                    ? "bg-green-900 text-green-300"
                    : problem.difficulty === "Medium"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-red-900 text-red-300"
                }`}
              >
                {problem.difficulty}
              </span>
              {isAttempted && (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-200 font-semibold">
                  {attempt.score}/20 pts
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-lg font-bold text-sm ${
            isPassed
              ? "bg-green-900/50 text-green-400 border border-green-700"
              : isAttempted
                ? "bg-yellow-900/50 text-yellow-400 border border-yellow-700"
                : "bg-blue-900/50 text-blue-400 border border-blue-700"
          }`}
        >
          {isPassed
            ? `Passed ✓ (${attempt.score}/20)`
            : isAttempted
              ? `Scored ${attempt.score}/20`
              : "Solve →"}
        </span>
      </div>
    </div>
  );
}
