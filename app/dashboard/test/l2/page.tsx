"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  getL2CurrentWeek,
  getStudentAvailableProblems,
  getUserAttemptedProblems,
  getUserL2History,
  submitL2Solution,
} from "@/app/actions/l2";

const TIMER_SECONDS = 10 * 60; // 10 minutes

interface Problem {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  week_number: number;
  leetcode_url?: string;
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

type PageMode = "loading" | "no-problems" | "menu" | "solving";

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

  // Solving state
  const [pastedCode, setPastedCode] = useState("");
  const [language, setLanguage] = useState<"python" | "java" | "c" | "cpp">("python");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSubmittedRef = useRef(false);

  // Tab tracking (informational — we allow tab switches for LeetCode)
  const [tabSwitches, setTabSwitches] = useState(0);

  // Confirmation dialog before starting
  const [confirmDialog, setConfirmDialog] = useState<{ problem: Problem; week: number } | null>(null);

  // Track started problems: problemId -> { startTime, week, code, language }
  const startedProblemsRef = useRef<Record<number, { startTime: number; week: number; code: string; language: string }>>({}); 

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
    if (mode !== "solving") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
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

  // Track tab switches (informational, not punitive — they need to use LeetCode)
  useEffect(() => {
    if (mode !== "solving") return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [mode]);

  const handleAutoSubmit = async () => {
    if (!userId || !selectedProblem) return;
    setIsSubmitting(true);

    const result = await submitL2Solution(
      userId,
      selectedProblem.id,
      selectedProblemWeek,
      pastedCode,
      language,
      true
    );

    if (result.success) {
      setSubmissionResult({
        score: result.score || 0,
        feedback: result.aiFeedback || "",
      });
      setAttemptedMap((prev) => ({
        ...prev,
        [selectedProblem.id]: {
          status: (result.score || 0) >= 18 ? "passed" : "failed",
          score: result.score || 0,
        },
      }));
      delete startedProblemsRef.current[selectedProblem.id];
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsSubmitting(false);
  };

  const openProblem = async (problem: Problem, weekNum: number) => {
    if (attemptedMap[problem.id]) return;

    const started = startedProblemsRef.current[problem.id];
    if (started) {
      // Already started — calculate remaining time, skip dialog
      const elapsed = Math.floor((Date.now() - started.startTime) / 1000);
      const remaining = Math.max(0, TIMER_SECONDS - elapsed);

      if (remaining <= 0) {
        // Time already expired while they were away — auto-submit directly
        hasSubmittedRef.current = true;
        setSelectedProblem(problem);
        setSelectedProblemWeek(started.week);
        setPastedCode(started.code);
        setLanguage(started.language as any);
        setTimeLeft(0);
        setSubmissionResult(null);
        setIsSubmitting(true);
        setMode("solving");

        // Submit directly using ref values (state not yet rendered)
        const result = await submitL2Solution(
          userId!,
          problem.id,
          started.week,
          started.code,
          started.language,
          true
        );

        if (result.success) {
          setSubmissionResult({
            score: result.score || 0,
            feedback: result.aiFeedback || "",
          });
          setAttemptedMap((prev) => ({
            ...prev,
            [problem.id]: {
              status: (result.score || 0) >= 18 ? "passed" : "failed",
              score: result.score || 0,
            },
          }));
          delete startedProblemsRef.current[problem.id];
        }
        setIsSubmitting(false);
        return;
      }

      setSelectedProblem(problem);
      setSelectedProblemWeek(started.week);
      setPastedCode(started.code);
      setLanguage(started.language as any);
      setTimeLeft(remaining);
      setSubmissionResult(null);
      hasSubmittedRef.current = false;
      setMode("solving");
      return;
    }

    // First time — show confirmation dialog
    setConfirmDialog({ problem, week: weekNum });
  };

  const confirmAndStart = () => {
    if (!confirmDialog) return;
    const pid = confirmDialog.problem.id;
    // Record start time
    startedProblemsRef.current[pid] = {
      startTime: Date.now(),
      week: confirmDialog.week,
      code: "",
      language,
    };
    setSelectedProblem(confirmDialog.problem);
    setSelectedProblemWeek(confirmDialog.week);
    setPastedCode("");
    setSubmissionResult(null);
    setTabSwitches(0);
    hasSubmittedRef.current = false;
    setTimeLeft(TIMER_SECONDS);
    setConfirmDialog(null);
    setMode("solving");
  };

  const handleSubmit = async () => {
    if (!userId || !selectedProblem || hasSubmittedRef.current) return;
    if (!pastedCode.trim()) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    const result = await submitL2Solution(
      userId,
      selectedProblem.id,
      selectedProblemWeek,
      pastedCode,
      language,
      false
    );

    if (result.success) {
      setSubmissionResult({
        score: result.score || 0,
        feedback: result.aiFeedback || "",
      });
      setAttemptedMap((prev) => ({
        ...prev,
        [selectedProblem.id]: {
          status: (result.score || 0) >= 18 ? "passed" : "failed",
          score: result.score || 0,
        },
      }));
      delete startedProblemsRef.current[selectedProblem.id];
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (!result.message?.includes("already attempted")) {
        hasSubmittedRef.current = false;
      }
    }
    setIsSubmitting(false);
  };

  const goBackToMenu = () => {
    // Save current code progress before leaving
    if (selectedProblem && startedProblemsRef.current[selectedProblem.id]) {
      startedProblemsRef.current[selectedProblem.id].code = pastedCode;
      startedProblemsRef.current[selectedProblem.id].language = language;
    }
    setSelectedProblem(null);
    setSubmissionResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (userId) loadData(userId);
    setMode("menu");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl border-2 border-orange-500 p-8 max-w-md w-full text-center">
              <p className="text-5xl mb-4">⚠️</p>
              <h2 className="text-xl font-bold text-orange-400 mb-3">Start Problem?</h2>
              <h3 className="text-lg font-semibold text-white mb-4">{confirmDialog.problem.title}</h3>
              <div className="bg-gray-900 rounded-xl p-4 mb-5 text-left space-y-2">
                <p className="text-red-400 text-sm font-semibold">⏱ 10-minute timer starts immediately</p>
                <p className="text-red-400 text-sm font-semibold">🚫 Only ONE attempt — no retries</p>
                <p className="text-yellow-300 text-sm">📤 After 10 minutes, whatever code you have pasted will be auto-submitted</p>
                <p className="text-gray-400 text-sm">💡 You can switch tabs freely to solve on LeetCode</p>
              </div>
              <p className="text-gray-500 text-xs mb-5">Make sure you are ready before starting.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 font-bold rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndStart}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition"
                >
                  Start (10 min) →
                </button>
              </div>
            </div>
          </div>
        )}

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
              <strong>How it works:</strong> Click a problem → Read the description → Open LeetCode in a new tab → Solve it there → Come back and paste your solution code → AI evaluates and scores 0-20 marks. 10-minute timer. One attempt only.
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
                {currentWeekProblems.map((problem, idx) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    index={idx}
                    attempt={attemptedMap[problem.id]}
                    onClick={() => openProblem(problem, currentWeek)}
                  />
                ))}
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
                {pw.problems.map((problem, idx) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    index={idx}
                    attempt={attemptedMap[problem.id]}
                    onClick={() => openProblem(problem, pw.week)}
                  />
                ))}
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

  if (mode === "solving" && selectedProblem) {
    const timerColor = timeLeft <= 60 ? "text-red-400" : timeLeft <= 180 ? "text-yellow-400" : "text-green-400";
    const leetcodeUrl = selectedProblem.leetcode_url;

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Submission Result Modal */}
        {submissionResult && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className={`bg-gray-800 rounded-2xl border-2 ${submissionResult.score >= 18 ? "border-green-500" : submissionResult.score >= 10 ? "border-yellow-500" : "border-red-500"} p-8 max-w-md w-full text-center`}>
              <p className="text-5xl mb-4">
                {submissionResult.score >= 18 ? "🎉" : submissionResult.score >= 10 ? "📝" : "😔"}
              </p>
              <h2 className={`text-2xl font-bold mb-3 ${submissionResult.score >= 18 ? "text-green-400" : submissionResult.score >= 10 ? "text-yellow-400" : "text-red-400"}`}>
                {submissionResult.score >= 18 ? "Excellent!" : submissionResult.score >= 10 ? "Good Attempt" : "Keep Practicing"}
              </h2>
              <div className="bg-gray-900 rounded-xl p-6 mb-4">
                <p className={`text-5xl font-black ${submissionResult.score >= 18 ? "text-green-400" : submissionResult.score >= 10 ? "text-yellow-400" : "text-red-400"}`}>
                  {submissionResult.score}/20
                </p>
                <p className="text-gray-500 text-sm mt-2">AI Evaluation Score</p>
              </div>
              {submissionResult.feedback && (
                <p className="text-gray-400 text-sm mb-6 italic bg-gray-900/50 p-3 rounded-lg">
                  &quot;{submissionResult.feedback}&quot;
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

        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
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
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 border ${timeLeft <= 60 ? "border-red-500 animate-pulse" : "border-gray-600"}`}>
              <span className="text-xs text-gray-400">⏱</span>
              <span className={`font-mono font-bold text-sm ${timerColor}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <span className="text-xs text-gray-500">Tab switches: {tabSwitches}</span>
          </div>
        </div>

        {/* Main content - split view */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Problem description */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-6">
            <div className="max-w-lg">
              <h2 className="text-xl font-bold text-white mb-4">{selectedProblem.title}</h2>
              <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans leading-relaxed bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                {selectedProblem.description}
              </pre>

              {/* Open LeetCode button */}
              {leetcodeUrl && (
                <a
                  href={leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition text-lg mb-4"
                >
                  Solve on LeetCode →
                </a>
              )}

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-300 text-xs">
                  <strong>Steps:</strong> 1) Read the problem above → 2) Click &quot;Solve on LeetCode&quot; to open in new tab → 3) Write &amp; test your solution there → 4) Copy your code → 5) Paste it on the right → 6) Select language and submit
                </p>
              </div>
            </div>
          </div>

          {/* Right: Code paste area */}
          <div className="w-1/2 flex flex-col bg-gray-900">
            {/* Language selector + submit */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-medium">Language:</span>
                <select
                  value={language}
                  onChange={(e) => {
                    const lang = e.target.value as "python" | "java" | "c" | "cpp";
                    setLanguage(lang);
                    if (selectedProblem && startedProblemsRef.current[selectedProblem.id]) {
                      startedProblemsRef.current[selectedProblem.id].language = lang;
                    }
                  }}
                  className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || hasSubmittedRef.current || !pastedCode.trim()}
                className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    AI Evaluating...
                  </span>
                ) : hasSubmittedRef.current ? (
                  "Submitted ✓"
                ) : (
                  "Submit for Review"
                )}
              </button>
            </div>

            {/* Code textarea */}
            <div className="flex-1 p-4">
              <textarea
                value={pastedCode}
                onChange={(e) => {
                  setPastedCode(e.target.value);
                  if (selectedProblem && startedProblemsRef.current[selectedProblem.id]) {
                    startedProblemsRef.current[selectedProblem.id].code = e.target.value;
                  }
                }}
                disabled={hasSubmittedRef.current}
                placeholder={`Paste your ${language} solution code here...\n\nSolve the problem on LeetCode first, then copy-paste your working solution.`}
                className="w-full h-full bg-gray-800 text-gray-200 border border-gray-700 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:opacity-50 placeholder-gray-600"
                spellCheck={false}
              />
            </div>

            {/* Info footer */}
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between">
              <span className="text-gray-500 text-xs">
                {pastedCode.trim() ? `${pastedCode.split("\n").length} lines` : "No code pasted yet"}
              </span>
              <span className="text-gray-500 text-xs">
                AI evaluates correctness, approach &amp; code quality
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Problem Card
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
