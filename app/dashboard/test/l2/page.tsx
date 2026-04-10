"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getQuestionsByLevel } from "@/app/actions/questions";
import { saveSampleTestAttempt, getSampleTestStats, getUserSampleTestHistory } from "@/app/actions/sampleTests";

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
  mode: "menu" | "test" | "results";
  currentQuestion: number;
  answers: (number | null)[];
  score: number;
  percentage: number;
  totalMarks: number;
  correct: number;
}

export default function L2TestPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [testState, setTestState] = useState<TestState>({
    mode: "menu",
    currentQuestion: 0,
    answers: [],
    score: 0,
    percentage: 0,
    totalMarks: 0,
    correct: 0,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<{ total_attempts: number; average_percentage: number; best_percentage: number; total_marks: number }>({ total_attempts: 0, average_percentage: 0, best_percentage: 0, total_marks: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"overview" | "practice" | "history">("overview");

  const TOTAL_QUESTIONS = 15;
  const POINTS_PER_QUESTION = 10;
  const MAX_MARKS = TOTAL_QUESTIONS * POINTS_PER_QUESTION;

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }

    const id = parseInt(storedUserId);
    setUserId(id);
    loadTestData(id);
  }, []);

  const loadTestData = async (id: number) => {
    try {
      const [questionsResult, statsResult, historyResult] = await Promise.all([
        getQuestionsByLevel(2, TOTAL_QUESTIONS),
        getSampleTestStats(id),
        getUserSampleTestHistory(id),
      ]);

      if (questionsResult.success && questionsResult.data) {
        setQuestions(questionsResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data);
      }
    } catch (error) {
      console.error("Error loading test data:", error);
    }

    setLoading(false);
  };

  const startTest = () => {
    if (questions.length === 0) return;

    setTestState({
      mode: "test",
      currentQuestion: 0,
      answers: new Array(questions.length).fill(null),
      score: 0,
      percentage: 0,
      totalMarks: 0,
      correct: 0,
    });
  };

  const selectAnswer = (optionNumber: number) => {
    const newAnswers = [...testState.answers];
    newAnswers[testState.currentQuestion] = optionNumber;
    setTestState({ ...testState, answers: newAnswers });
  };

  const goToPreviousQuestion = () => {
    if (testState.currentQuestion > 0) {
      setTestState({ ...testState, currentQuestion: testState.currentQuestion - 1 });
    }
  };

  const goToNextQuestion = () => {
    if (testState.currentQuestion < questions.length - 1) {
      setTestState({ ...testState, currentQuestion: testState.currentQuestion + 1 });
    }
  };

  const submitTest = async () => {
    let correctCount = 0;

    testState.answers.forEach((answer, index) => {
      if (answer === questions[index].correct_option) {
        correctCount++;
      }
    });

    const marks = correctCount * POINTS_PER_QUESTION;
    const percentage = (correctCount / questions.length) * 100;

    if (userId) {
      // Filter out null answers before saving
      const filteredAnswers = testState.answers.filter((ans): ans is number => ans !== null);
      const saveResult = await saveSampleTestAttempt(userId, questions, filteredAnswers, marks);
      if (saveResult.success) {
        await loadTestData(userId);
      }
    }

    setTestState({
      mode: "results",
      currentQuestion: 0,
      answers: testState.answers,
      score: correctCount,
      percentage: percentage,
      totalMarks: marks,
      correct: correctCount,
    });
  };

  const restartTest = () => {
    startTest();
  };

  const backToDashboard = () => {
    setTestState({
      mode: "menu",
      currentQuestion: 0,
      answers: [],
      score: 0,
      percentage: 0,
      totalMarks: 0,
      correct: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-600">Loading Level 2 Assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition">
              🎯 Level 2 Assessment
            </h1>
          </Link>
          <div className="text-sm text-gray-600">
            {testState.mode === "test" && `Question ${testState.currentQuestion + 1} of ${questions.length}`}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Menu Mode - Overview with Tabs */}
        {testState.mode === "menu" && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                onClick={() => setSelectedTab("overview")}
                className={`flex-1 py-4 px-6 font-semibold transition ${
                  selectedTab === "overview"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setSelectedTab("practice")}
                className={`flex-1 py-4 px-6 font-semibold transition ${
                  selectedTab === "practice"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📝 Practice
              </button>
              <button
                onClick={() => setSelectedTab("history")}
                className={`flex-1 py-4 px-6 font-semibold transition ${
                  selectedTab === "history"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📈 History
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {selectedTab === "overview" && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-blue-600">{stats.total_attempts}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Attempts</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-green-600">{stats.average_percentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600 mt-1">Average Score</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-purple-600">{stats.best_percentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600 mt-1">Best Score</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-orange-600">{stats.total_marks}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Marks</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">About Level 2</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Level 2 is an Intermediate assessment featuring 15 questions on advanced problem-solving,
                      logical reasoning, and pattern recognition. This test measures your ability to solve complex
                      problems with multiple steps and analytical thinking. Average time: 45-60 minutes.
                    </p>
                  </div>

                  <button
                    onClick={startTest}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    🚀 Attend Sample Test L2
                  </button>
                </div>
              )}

              {selectedTab === "practice" && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Test Details</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Questions:</span>
                      <span className="font-semibold">{TOTAL_QUESTIONS} questions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Marks:</span>
                      <span className="font-semibold">{MAX_MARKS} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="font-semibold">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pass Score:</span>
                      <span className="font-semibold">70% (105 marks)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-semibold">Intermediate 🟡</span>
                    </div>
                  </div>
                  <button
                    onClick={startTest}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    📝 Start Practice Test
                  </button>
                </div>
              )}

              {selectedTab === "history" && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Attempt History</h3>
                  {history.length === 0 ? (
                    <p className="text-gray-600">No attempts yet. Start your first test!</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((attempt, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-900">Attempt {history.length - idx}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(attempt.attempted_at).toLocaleDateString()} at{" "}
                              {new Date(attempt.attempted_at).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{attempt.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">{attempt.marks} marks</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Mode */}
        {testState.mode === "test" && questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${((testState.currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Counter */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-700">
                Question {testState.currentQuestion + 1} of {questions.length} •{" "}
                {testState.answers.filter((a) => a !== null).length} answered
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                {questions[testState.currentQuestion].category}
              </div>
            </div>

            {/* Question Content */}
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {questions[testState.currentQuestion].question_text}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {["option_a", "option_b", "option_c", "option_d"].map((key, idx) => {
                    const optionNumber = idx + 1;
                    const isSelected = testState.answers[testState.currentQuestion] === optionNumber;

                    return (
                      <button
                        key={key}
                        onClick={() => selectAnswer(optionNumber)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-blue-400"
                        }`}
                      >
                        <div className="flex items-start">
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${
                              isSelected
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{String.fromCharCode(65 + idx)}</div>
                            <div className="text-gray-700">
                              {questions[testState.currentQuestion][key as keyof Question] as string}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="pt-6">
                <p className="text-xs text-gray-600 mb-2">Quick Navigation:</p>
                <div className="flex flex-wrap gap-2">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestState({ ...testState, currentQuestion: idx })}
                      className={`w-8 h-8 rounded text-xs font-semibold transition ${
                        testState.answers[idx] !== null
                          ? "bg-green-600 text-white"
                          : idx === testState.currentQuestion
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-8 py-4 border-t flex justify-between">
              <button
                onClick={goToPreviousQuestion}
                disabled={testState.currentQuestion === 0}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
              >
                ← Previous
              </button>

              {testState.currentQuestion === questions.length - 1 ? (
                <button
                  onClick={submitTest}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  ✓ Submit Test
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Mode */}
        {testState.mode === "results" && (
          <div className="space-y-6">
            {/* Results Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Test Complete!</h2>

              {/* Score Circle */}
              <div className="inline-flex items-center justify-center mb-8">
                <div className="relative">
                  <svg className="transform -rotate-90" width="200" height="200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(testState.percentage / 100) * 565} 565`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-blue-600">
                        {testState.percentage.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{testState.correct}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{questions.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{testState.totalMarks}</div>
                  <div className="text-sm text-gray-600">Marks</div>
                </div>
              </div>

              {/* Status */}
              <div
                className={`rounded-lg p-4 mb-8 ${
                  testState.percentage >= 70
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <div className="font-bold">
                  {testState.percentage >= 70 ? "✓ Passed!" : "⚠ Needs Improvement"}
                </div>
                <div className="text-sm">
                  {testState.percentage >= 70
                    ? "Congratulations! You scored above 70%."
                    : "Try again to achieve 70% or higher."}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={restartTest}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  🔄 Take Another Test
                </button>
                <Link href="/dashboard">
                  <button className="px-8 py-3 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition">
                    ← Back to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
