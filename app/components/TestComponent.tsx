"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitTestScore, updateUserProgress } from "@/app/actions/dashboard";
import { getQuestionsByLevel } from "@/app/actions/questions";

interface TestQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
}

interface DatabaseQuestion extends TestQuestion {
  category: string;
  difficulty: string;
}

export default function TestPage({
  level,
  userId,
}: {
  level: number;
  userId: number;
}) {
  const [questions, setQuestions] = useState<DatabaseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const result = await getQuestionsByLevel(level, 10);
      if (result.success && result.data) {
        setQuestions(result.data);
        setAnswers(new Array(result.data.length).fill(null));
      } else {
        setError(result.message || "Failed to load questions");
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [level]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, idx) => {
      // answers are 0-3 indexed (A, B, C, D)
      // correct_option is 1-4 indexed (1=A, 2=B, 3=C, 4=D)
      if (answers[idx] === question.correct_option - 1) {
        correct++;
      }
    });
    return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const score = calculateScore();
    const correct = answers.filter(
      (ans, idx) => ans === questions[idx].correct_option - 1
    ).length;

    const result = await submitTestScore(
      userId,
      level,
      score,
      questions.length,
      correct
    );

    if (result.success) {
      await updateUserProgress(userId, level, 1);
      setShowResults(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600 text-lg">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-red-600 text-lg">Error: {error}</p>
        <Link href="/dashboard/test">
          <button className="mt-4 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Back to Tests
          </button>
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600 text-lg">No questions available for Level {level}</p>
        <Link href="/admin/questions">
          <button className="mt-4 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Add Questions
          </button>
        </Link>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const correct = answers.filter(
      (ans, idx) => ans === questions[idx].correct_option - 1
    ).length;

    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Test Complete!</h2>

        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-8 mb-8">
          <p className="text-gray-700 mb-2">Your Score</p>
          <p className="text-6xl font-bold text-blue-600 mb-4">{score}%</p>
          <p className="text-lg text-gray-700">
            {correct} out of {questions.length} correct
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Level</p>
            <p className="text-2xl font-bold text-green-600">{level}</p>
          </div>
          <div className={`border-l-4 rounded-lg p-6 ${
            score >= 70 ? "bg-green-50 border-green-600" : "bg-orange-50 border-orange-600"
          }`}>
            <p className="text-gray-600 text-sm">Status</p>
            <p className={`text-2xl font-bold ${score >= 70 ? "text-green-600" : "text-orange-600"}`}>
              {score >= 70 ? "Passed" : "Try Again"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/dashboard/test">
            <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              Back to Tests
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const options = [question.option_a, question.option_b, question.option_c, question.option_d];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Level {level} Test</h2>
          <span className="text-sm font-semibold text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-600">{question.category}</span>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {question.difficulty}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {question.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                answers[currentQuestion] === idx
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span className="flex items-center">
                <span
                  className={`inline-block w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center font-semibold ${
                    answers[currentQuestion] === idx
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-400 text-gray-600"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-8 border-t">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Next
          </button>
        )}
      </div>

      {/* Question Indicator */}
      <div className="mt-8 pt-8 border-t">
        <p className="text-sm text-gray-600 mb-3">Skip to question:</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded font-bold transition ${
                currentQuestion === idx
                  ? "bg-blue-600 text-white"
                  : answers[idx] !== null
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
  );
}
