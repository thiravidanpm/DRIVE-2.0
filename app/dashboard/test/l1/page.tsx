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

export default function L1TestPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [testState, setTestState] = useState<TestState>({
    mode: "menu",
    currentQuestion: 0,
    answers: [],
    score: 0,
    percentage: 0,
    totalMarks: 100,
    correct: 0,
  });
  const [stats, setStats] = useState<{ total_attempts: number; average_percentage: number; best_percentage: number; total_marks: number }>({ total_attempts: 0, average_percentage: 0, best_percentage: 0, total_marks: 0 });
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "practice" | "history">("overview");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }

    setUserId(parseInt(storedUserId));
    loadData(parseInt(storedUserId));
  }, []);

  const loadData = async (userId: number) => {
    setLoading(true);

    // Get questions
    const qResult = await getQuestionsByLevel(1, 10);
    if (qResult.success && qResult.data) {
      setQuestions(qResult.data);
      setTestState((prev) => ({ ...prev, answers: new Array(qResult.data.length).fill(null) }));
    }

    // Get stats
    const statsResult = await getSampleTestStats(userId);
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    }

    // Get history
    const historyResult = await getUserSampleTestHistory(userId);
    if (historyResult.success && historyResult.data) {
      setTestHistory(historyResult.data);
    }

    setLoading(false);
  };

  const handleStartTest = () => {
    if (questions.length === 0) {
      alert("No questions available. Admin needs to sync questions first.");
      return;
    }
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
      if (ans === testQuestions[idx].correct_option - 1) {
        correct++;
      }
    });

    const marks = Math.round((correct / testQuestions.length) * 100);
    const percentage = marks;

    // Save to database - filter out null answers
    const filteredAnswers = testState.answers.filter((ans): ans is number => ans !== null);
    const result = await saveSampleTestAttempt(userId, testQuestions, filteredAnswers, marks);

    if (result.success) {
      setTestState((prev) => ({
        ...prev,
        mode: "results",
        score: marks,
        percentage,
        correct,
        totalMarks: testQuestions.length,
      }));

      // Reload stats
      const statsResult = await getSampleTestStats(userId);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    }
  };

  const handleGoToMenu = () => {
    setTestState((prev) => ({
      ...prev,
      mode: "menu",
      currentQuestion: 0,
      answers: new Array(questions.length).fill(null),
    }));
    setActiveTab("overview");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Loading Level 1 Assessment...</p>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Menu Mode (Overview)
  if (testState.mode === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Level 1 - Aptitude Assessment</h1>
              <p className="text-gray-600 mt-1">Master the fundamentals</p>
            </div>
            <Link href="/dashboard">
              <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex gap-2 border-b border-gray-300 mb-8">
            {["overview", "practice", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 font-semibold transition border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "overview" && "📊 Overview"}
                {tab === "practice" && "📝 Practice"}
                {tab === "history" && "📈 History"}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                  <p className="text-gray-600 text-sm">Total Attempts</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_attempts}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.average_percentage}%</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
                  <p className="text-gray-600 text-sm">Best Score</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.best_percentage}%</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
                  <p className="text-gray-600 text-sm">Total Marks</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.total_marks}</p>
                </div>
              </div>

              {/* About Level 1 */}
              <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About Level 1</h2>
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>Focus:</strong> Aptitude fundamentals for career development and competitive exams
                  </p>
                  <p>
                    <strong>Topics Covered:</strong> Numbers, Percentages, Ratios, Time & Work, Average, Ages, Profit & Loss,
                    and more
                  </p>
                  <p>
                    <strong>Question Format:</strong> Multiple choice questions with 4 options
                  </p>
                  <p>
                    <strong>Sample Test:</strong> 10 randomly selected questions from the question bank
                  </p>
                  <p>
                    <strong>Scoring:</strong> Each correct answer = 10 points, Total = 100 points
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Test Your Skills?</h3>
                <p className="mb-6">Take a sample test with 10 random questions and see how well you perform!</p>
                <button
                  onClick={handleStartTest}
                  className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition text-lg"
                >
                  🎯 Attend Sample Test
                </button>
              </div>
            </div>
          )}

          {/* Practice Tab */}
          {activeTab === "practice" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Practice Mode</h2>
                <p className="text-gray-700 mb-6">
                  Start a new sample test to practice. Each test consists of 10 randomly selected questions from the question bank.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
                  <h3 className="font-bold text-blue-900 mb-2">Test Details</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>✓ Questions: 10</li>
                    <li>✓ Questions per section: Randomly selected</li>
                    <li>✓ Time Limit: Unlimited</li>
                    <li>✓ Passing Score: 70% (7/10)</li>
                    <li>✓ Answers saved instantly</li>
                  </ul>
                </div>

                <button
                  onClick={handleStartTest}
                  className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-lg"
                >
                  Start New Sample Test
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Test History</h2>

              {testHistory.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600 text-lg">No tests taken yet. Start your first test now!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testHistory.map((test, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg shadow p-6 flex justify-between items-center border-l-4 border-blue-600"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">Test #{testHistory.length - idx}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(test.attempted_at).toLocaleDateString()} at{" "}
                          {new Date(test.attempted_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{test.percentage}%</p>
                        <p className="text-sm text-gray-600">
                          {test.correct_answers}/{test.total_questions} correct
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Test Mode
  if (testState.mode === "test") {
    const testQuestions = questions.slice(0, 10);
    const currentQ = testQuestions[testState.currentQuestion];

    if (!currentQ) {
      return <div>No questions available</div>;
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Question {testState.currentQuestion + 1} of {testQuestions.length}</h1>
              <span className="text-sm font-semibold text-gray-600">
                {testState.answers.filter((a) => a !== null).length} answered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${((testState.currentQuestion + 1) / testQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-2">
                  {currentQ.category}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentQ.difficulty === "Easy"
                    ? "bg-green-100 text-green-800"
                    : currentQ.difficulty === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {currentQ.difficulty}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-8">{currentQ.question_text}</h2>

            {/* Options */}
            <div className="space-y-3">
              {[
                { idx: 0, text: currentQ.option_a, label: "A" },
                { idx: 1, text: currentQ.option_b, label: "B" },
                { idx: 2, text: currentQ.option_c, label: "C" },
                { idx: 3, text: currentQ.option_d, label: "D" },
              ].map(({ idx, text, label }) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    testState.answers[testState.currentQuestion] === idx
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold mr-4 ${
                        testState.answers[testState.currentQuestion] === idx
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-gray-900">{text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handlePrevious}
              disabled={testState.currentQuestion === 0}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>

            {testState.currentQuestion === testQuestions.length - 1 ? (
              <button
                onClick={handleSubmitTest}
                className="px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                ✓ Submit Test
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Next →
              </button>
            )}
          </div>

          {/* Question Indicators */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-4 font-semibold">Skip to question:</p>
            <div className="flex flex-wrap gap-2">
              {testQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestState((prev) => ({ ...prev, currentQuestion: idx }))}
                  className={`w-10 h-10 rounded font-bold transition ${
                    testState.currentQuestion === idx
                      ? "bg-blue-600 text-white"
                      : testState.answers[idx] !== null
                        ? "bg-green-200 text-green-900"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Mode
  if (testState.mode === "results") {
    const testQuestions = questions.slice(0, 10);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Results Card */}
          <div className="bg-white rounded-lg shadow-2xl p-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Test Complete! ✨</h1>

            {/* Score Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <div className="bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center">
                  <p className="text-5xl font-bold text-blue-600">{testState.score}%</p>
                  <p className="text-gray-600 text-sm mt-2">Your Score</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Correct</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{testState.correct}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{testState.totalMarks}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Marks</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{testState.score}</p>
              </div>
            </div>

            {/* Status */}
            <div
              className={`p-6 rounded-lg mb-8 ${
                testState.score >= 70
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-yellow-100 text-yellow-800 border border-yellow-300"
              }`}
            >
              <p className="text-lg font-bold">
                {testState.score >= 70 ? "🎉 PASSED" : "📚 Need Improvement"}
              </p>
              <p className="text-sm mt-2">
                {testState.score >= 70
                  ? "Great job! You've mastered the Level 1 concepts."
                  : "Keep practicing to improve your score!"}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleGoToMenu}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Take Another Test
              </button>
              <Link href="/dashboard" className="block">
                <button className="w-full px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
