"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getCurrentWeekQuestions,
  hasUserCompletedWeek,
  saveWeeklyResult,
  getCurrentWeek,
  getUserWeeklyHistory,
} from "@/app/actions/weekly";

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
  category: string;
  difficulty: string;
}

interface TestState {
  mode: "loading" | "completed" | "no-questions" | "menu" | "test" | "results";
  currentQuestion: number;
  answers: (number | null)[];
  score: number;
  percentage: number;
  totalMarks: number;
  correct: number;
}

interface WeeklyResult {
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

interface WeeklyHistoryEntry {
  week_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export default function L1TestPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weeklyResult, setWeeklyResult] = useState<WeeklyResult | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryEntry[]>([]);
  const [testState, setTestState] = useState<TestState>({
    mode: "loading",
    currentQuestion: 0,
    answers: [],
    score: 0,
    percentage: 0,
    totalMarks: 10,
    correct: 0,
  });
  const [activeTab, setActiveTab] = useState<"overview" | "test" | "history">("overview");

  // Fullscreen & violation tracking
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
    setTestState((prev) => ({ ...prev, mode: "loading" }));
    const weekRes = await getCurrentWeek();
    const week = weekRes.week;
    setCurrentWeek(week);

    const completionRes = await hasUserCompletedWeek(uid, week);
    if (completionRes.completed && completionRes.result) {
      setWeeklyResult(completionRes.result);
    }

    const qRes = await getCurrentWeekQuestions();
    if (qRes.success && qRes.data && qRes.data.length > 0) {
      setQuestions(qRes.data);
    }

    const histRes = await getUserWeeklyHistory(uid);
    if (histRes.success && histRes.data) {
      setWeeklyHistory(histRes.data);
    }

    if (completionRes.completed) {
      setTestState((prev) => ({ ...prev, mode: "completed" }));
    } else if (!qRes.success || !qRes.data || qRes.data.length === 0) {
      setTestState((prev) => ({ ...prev, mode: "no-questions" }));
    } else {
      setTestState((prev) => ({
        ...prev,
        mode: "menu",
        answers: new Array(Math.min(10, qRes.data!.length)).fill(null),
      }));
    }
  };

  // Fullscreen helpers
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by browser
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } catch {
      // Ignore
    }
  }, []);

  // Auto-submit triggered by violations
  const triggerAutoSubmit = useCallback(async () => {
    if (autoSubmitRef.current || !userId) return;
    autoSubmitRef.current = true;
    const testQuestions = questions.slice(0, 10);
    let correct = 0;
    testState.answers.forEach((ans, idx) => {
      if (idx < testQuestions.length && ans === testQuestions[idx].correct_option - 1) {
        correct++;
      }
    });
    const score = correct;
    const percentage = Math.round((correct / testQuestions.length) * 100);

    const result = await saveWeeklyResult(userId, currentWeek, score, testQuestions.length);
    exitFullscreen();
    if (result.success) {
      setWeeklyResult({ score, total_questions: testQuestions.length, percentage, completed_at: new Date().toISOString() });
      setTestState((prev) => ({ ...prev, mode: "results", score, percentage, correct, totalMarks: testQuestions.length }));
    } else {
      setTestState((prev) => ({ ...prev, mode: "completed" }));
    }
  }, [userId, questions, testState.answers, currentWeek, exitFullscreen]);

  // Visibility change + fullscreen exit detection during test
  useEffect(() => {
    if (testState.mode !== "test") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_VIOLATIONS) {
            setViolationMessage(`Violation ${newCount}/${MAX_VIOLATIONS}: Maximum violations reached! Your test is being auto-submitted.`);
            setShowViolationWarning(true);
            setTimeout(() => {
              triggerAutoSubmit();
            }, 2000);
          } else {
            setViolationMessage(`Violation ${newCount}/${MAX_VIOLATIONS}: You switched tabs/windows! ${MAX_VIOLATIONS - newCount} violation(s) remaining before auto-submit.`);
            setShowViolationWarning(true);
          }
          return newCount;
        });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testState.mode === "test" && !autoSubmitRef.current) {
        // User exited fullscreen — count as violation
        setViolations((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_VIOLATIONS) {
            setViolationMessage(`Violation ${newCount}/${MAX_VIOLATIONS}: Maximum violations reached! Your test is being auto-submitted.`);
            setShowViolationWarning(true);
            setTimeout(() => {
              triggerAutoSubmit();
            }, 2000);
          } else {
            setViolationMessage(`Violation ${newCount}/${MAX_VIOLATIONS}: You exited fullscreen! ${MAX_VIOLATIONS - newCount} violation(s) remaining. Returning to fullscreen...`);
            setShowViolationWarning(true);
            // Re-enter fullscreen after warning
            setTimeout(() => {
              enterFullscreen();
            }, 1500);
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [testState.mode, triggerAutoSubmit, enterFullscreen]);

  const dismissViolationWarning = () => {
    setShowViolationWarning(false);
  };

  const handleStartTest = () => {
    if (questions.length === 0) return;
    setViolations(0);
    setShowViolationWarning(false);
    autoSubmitRef.current = false;
    enterFullscreen();
    setTestState((prev) => ({
      ...prev,
      mode: "test",
      currentQuestion: 0,
      answers: new Array(Math.min(10, questions.length)).fill(null),
    }));
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...testState.answers];
    newAnswers[testState.currentQuestion] = optionIndex;
    setTestState((prev) => ({ ...prev, answers: newAnswers }));
  };

  const handleNext = () => {
    const testQuestions = questions.slice(0, 10);
    if (testState.currentQuestion < testQuestions.length - 1) {
      setTestState((prev) => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }));
    }
  };

  const handlePrevious = () => {
    if (testState.currentQuestion > 0) {
      setTestState((prev) => ({ ...prev, currentQuestion: prev.currentQuestion - 1 }));
    }
  };

  const handleSubmitTest = async () => {
    if (!userId) return;
    const testQuestions = questions.slice(0, 10);
    let correct = 0;
    testState.answers.forEach((ans, idx) => {
      if (idx < testQuestions.length && ans === testQuestions[idx].correct_option - 1) {
        correct++;
      }
    });
    const score = correct;
    const percentage = Math.round((correct / testQuestions.length) * 100);

    exitFullscreen();
    const result = await saveWeeklyResult(userId, currentWeek, score, testQuestions.length);
    if (result.success) {
      setWeeklyResult({ score, total_questions: testQuestions.length, percentage, completed_at: new Date().toISOString() });
      setTestState((prev) => ({ ...prev, mode: "results", score, percentage, correct, totalMarks: testQuestions.length }));
    } else if (result.message.includes("already completed")) {
      const checkRes = await hasUserCompletedWeek(userId, currentWeek);
      if (checkRes.completed && checkRes.result) {
        setWeeklyResult(checkRes.result);
        setTestState((prev) => ({ ...prev, mode: "completed" }));
      }
    } else {
      alert(result.message);
    }
  };

  const handleBackToMenu = () => {
    if (weeklyResult) {
      setTestState((prev) => ({ ...prev, mode: "completed" }));
    } else {
      setTestState((prev) => ({ ...prev, mode: "menu", currentQuestion: 0, answers: new Array(questions.length).fill(null), score: 0, percentage: 0, totalMarks: 10, correct: 0 }));
    }
    setActiveTab("overview");
  };

  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Weekly History</h2>
      {weeklyHistory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">No test history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weeklyHistory.map((entry, idx) => (
            <div key={idx} className={`bg-white rounded-lg shadow p-6 flex justify-between items-center border-l-4 ${entry.score >= 7 ? "border-green-600" : "border-yellow-500"}`}>
              <div>
                <p className="font-semibold text-gray-900">Week {entry.week_number}</p>
                <p className="text-sm text-gray-600">{new Date(entry.completed_at).toLocaleDateString()} at {new Date(entry.completed_at).toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{entry.score}/{entry.total_questions}</p>
                <p className="text-sm text-gray-600">{entry.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (testState.mode === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Loading Level 1 Assessment...</p>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (testState.mode === "no-questions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-12 text-center max-w-md">
          <p className="text-6xl mb-4">📋</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Week {currentWeek}</h1>
          <p className="text-gray-600 mb-6">No questions available for this week yet. The admin needs to generate questions first.</p>
          <Link href="/dashboard"><button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Back to Dashboard</button></Link>
        </div>
      </div>
    );
  }

  if (testState.mode === "completed" && weeklyResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Level 1 - Week {currentWeek}</h1>
              <p className="text-gray-600 mt-1">Aptitude Assessment</p>
            </div>
            <Link href="/dashboard"><button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Back to Dashboard</button></Link>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex gap-2 border-b border-gray-300 mb-8">
            {(["overview", "history"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                {tab === "overview" && "📊 This Week"}
                {tab === "history" && "📈 History"}
              </button>
            ))}
          </div>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
                <p className="text-5xl mb-4">✅</p>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Week {currentWeek} Test Completed!</h2>
                <p className="text-green-700 mb-6">You have already taken this week&apos;s test. Come back next week for new questions!</p>
                <div className="inline-block bg-white rounded-xl shadow-lg p-8 mb-6">
                  <div className="relative w-36 h-36 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                      <div className="bg-white rounded-full w-28 h-28 flex flex-col items-center justify-center">
                        <p className="text-4xl font-bold text-blue-600">{weeklyResult.score}/{weeklyResult.total_questions}</p>
                        <p className="text-gray-500 text-xs mt-1">Score</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">{weeklyResult.percentage}%</p>
                  <p className="text-sm text-gray-500 mt-1">Completed on {new Date(weeklyResult.completed_at).toLocaleDateString()} at {new Date(weeklyResult.completed_at).toLocaleTimeString()}</p>
                </div>
                <div className={`p-4 rounded-lg mx-auto max-w-sm ${weeklyResult.score >= 7 ? "bg-green-100 text-green-800 border border-green-300" : "bg-yellow-100 text-yellow-800 border border-yellow-300"}`}>
                  <p className="font-bold">{weeklyResult.score >= 7 ? "🎉 PASSED" : "📚 Needs Improvement"}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === "history" && renderHistory()}
        </div>
      </div>
    );
  }

  if (testState.mode === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Level 1 - Week {currentWeek}</h1>
              <p className="text-gray-600 mt-1">Aptitude Assessment</p>
            </div>
            <Link href="/dashboard"><button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Back to Dashboard</button></Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex gap-2 border-b border-gray-300 mb-8">
            {(["overview", "test", "history"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                {tab === "overview" && "📊 Overview"}
                {tab === "test" && "📝 Take Test"}
                {tab === "history" && "📈 History"}
              </button>
            ))}
          </div>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-lg">Week {currentWeek}</span>
                  <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">{questions.length} Questions Ready</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Week&apos;s Test</h2>
                <div className="space-y-3 text-gray-700">
                  <p><strong>Format:</strong> 10 multiple choice questions with 4 options each</p>
                  <p><strong>Scoring:</strong> 1 point per correct answer, Total = 10 points</p>
                  <p><strong>Passing Score:</strong> 7/10 (70%)</p>
                  <p><strong>Attempts:</strong> You can take this test <span className="text-red-600 font-bold">only once</span> per week</p>
                  <p><strong>Topics:</strong> Numbers, Percentages, Ratios, Time &amp; Work, Logical Reasoning, and more</p>
                </div>
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                <h3 className="font-bold text-amber-900 mb-2">⚠️ Important</h3>
                <ul className="text-amber-800 space-y-1">
                  <li>• You can only attempt this test <strong>once per week</strong>. Make sure you are ready before starting.</li>
                  <li>• The test will open in <strong>fullscreen mode</strong>. Do not exit fullscreen.</li>
                  <li>• <strong>Tab switching / exiting fullscreen</strong> counts as a violation.</li>
                  <li>• After <strong>3 violations</strong>, your test will be <strong>auto-submitted</strong> immediately.</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Begin?</h3>
                <p className="mb-6">The test will open in fullscreen. Do not switch tabs or exit — 3 violations will auto-submit your test.</p>
                <button onClick={handleStartTest} className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition text-lg">🎯 Start Week {currentWeek} Test</button>
              </div>
            </div>
          )}
          {activeTab === "test" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Week {currentWeek} Test</h2>
                <p className="text-gray-700 mb-6">Answer 10 aptitude questions. You have only <strong>one attempt</strong> per week.</p>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
                  <h3 className="font-bold text-blue-900 mb-2">Details</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>✓ 10 questions • 1 point each</li>
                    <li>✓ One attempt per week only</li>
                    <li>✓ Passing Score: 7/10 (70%)</li>
                    <li>✓ Score recorded on leaderboard</li>
                    <li>🔒 Test opens in fullscreen mode</li>
                    <li>⚠️ 3 violations (tab switch / exit fullscreen) = auto-submit</li>
                  </ul>
                </div>
                <button onClick={handleStartTest} className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-lg">Start Test</button>
              </div>
            </div>
          )}
          {activeTab === "history" && renderHistory()}
        </div>
      </div>
    );
  }

  if (testState.mode === "test") {
    const testQuestions = questions.slice(0, 10);
    const currentQ = testQuestions[testState.currentQuestion];
    if (!currentQ) return <div className="p-8 text-center text-gray-600">No questions available</div>;
    return (
      <div className="min-h-screen bg-gray-50 p-4 relative">
        {/* Violation Warning Overlay */}
        {showViolationWarning && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-pulse">
              <p className="text-6xl mb-4">⚠️</p>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Warning!</h2>
              <p className="text-gray-800 mb-6 text-lg">{violationMessage}</p>
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: MAX_VIOLATIONS }, (_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full ${i < violations ? "bg-red-500" : "bg-gray-300"}`} />
                ))}
              </div>
              {violations < MAX_VIOLATIONS && (
                <button
                  onClick={dismissViolationWarning}
                  className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                >
                  I Understand — Continue Test
                </button>
              )}
              {violations >= MAX_VIOLATIONS && (
                <p className="text-red-600 font-bold animate-pulse">Auto-submitting your test...</p>
              )}
            </div>
          </div>
        )}

        {/* Violations Counter - Top Bar */}
        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex justify-between items-center bg-white rounded-lg shadow px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">🔒 FULLSCREEN MODE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-500">Violations:</span>
                {Array.from({ length: MAX_VIOLATIONS }, (_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < violations ? "bg-red-500" : "bg-green-400"}`} />
                ))}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${violations === 0 ? "bg-green-100 text-green-800" : violations < MAX_VIOLATIONS ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                {violations}/{MAX_VIOLATIONS}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Question {testState.currentQuestion + 1} of {testQuestions.length}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Week {currentWeek}</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">{testState.answers.filter((a) => a !== null).length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${((testState.currentQuestion + 1) / testQuestions.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="mb-6 flex justify-between items-start">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">{currentQ.category}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentQ.difficulty === "Easy" ? "bg-green-100 text-green-800" : currentQ.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{currentQ.difficulty}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{currentQ.question_text}</h2>
            <div className="space-y-3">
              {[{ idx: 0, text: currentQ.option_a, label: "A" }, { idx: 1, text: currentQ.option_b, label: "B" }, { idx: 2, text: currentQ.option_c, label: "C" }, { idx: 3, text: currentQ.option_d, label: "D" }].map(({ idx, text, label }) => (
                <button key={idx} onClick={() => handleAnswer(idx)} className={`w-full text-left p-4 rounded-lg border-2 transition ${testState.answers[testState.currentQuestion] === idx ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-400"}`}>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold mr-4 ${testState.answers[testState.currentQuestion] === idx ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>{label}</span>
                    <span className="text-gray-900">{text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevious} disabled={testState.currentQuestion === 0} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition">← Previous</button>
            {testState.currentQuestion === testQuestions.length - 1 ? (
              <button onClick={handleSubmitTest} className="px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">✓ Submit Test</button>
            ) : (
              <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Next →</button>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-4 font-semibold">Skip to question:</p>
            <div className="flex flex-wrap gap-2">
              {testQuestions.map((_, idx) => (
                <button key={idx} onClick={() => setTestState((prev) => ({ ...prev, currentQuestion: idx }))} className={`w-10 h-10 rounded font-bold transition ${testState.currentQuestion === idx ? "bg-blue-600 text-white" : testState.answers[idx] !== null ? "bg-green-200 text-green-900" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{idx + 1}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testState.mode === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Week {currentWeek} Complete! ✨</h1>
            <p className="text-gray-500 mb-6">Your score has been recorded on the leaderboard.</p>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <div className="bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center">
                  <p className="text-5xl font-bold text-blue-600">{testState.score}/{testState.totalMarks}</p>
                  <p className="text-gray-600 text-sm mt-2">Your Score</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4"><p className="text-gray-600 text-sm">Correct</p><p className="text-2xl font-bold text-blue-600 mt-1">{testState.correct}</p></div>
              <div className="bg-gray-50 rounded-lg p-4"><p className="text-gray-600 text-sm">Total</p><p className="text-2xl font-bold text-gray-600 mt-1">{testState.totalMarks}</p></div>
              <div className="bg-green-50 rounded-lg p-4"><p className="text-gray-600 text-sm">Percentage</p><p className="text-2xl font-bold text-green-600 mt-1">{testState.percentage}%</p></div>
            </div>
            <div className={`p-6 rounded-lg mb-8 ${testState.score >= 7 ? "bg-green-100 text-green-800 border border-green-300" : "bg-yellow-100 text-yellow-800 border border-yellow-300"}`}>
              <p className="text-lg font-bold">{testState.score >= 7 ? "🎉 PASSED" : "📚 Need Improvement"}</p>
              <p className="text-sm mt-2">{testState.score >= 7 ? "Great job! You mastered this week." : "Practice more. You need at least 7/10 to pass."}</p>
            </div>
            <div className="space-y-3">
              <button onClick={handleBackToMenu} className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">View Results</button>
              <Link href="/dashboard" className="block"><button className="w-full px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition">Back to Dashboard</button></Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
