"use client";

import { useState, useEffect } from "react";
import {
  addQuestion,
  getAllQuestions,
  deleteQuestion,
  getQuestionCountByLevel,
} from "@/app/actions/questions";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [counts, setCounts] = useState({ level1: 0, level2: 0 });
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    level: 1,
    category: "Aptitude",
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: 1,
    difficulty: "Medium",
  });
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    fetchQuestions();
    fetchCounts();
  }, [selectedLevel]);

  const fetchQuestions = async () => {
    setLoading(true);
    const result = await getAllQuestions(selectedLevel);
    if (result.success) {
      setQuestions(result.data || []);
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    const result = await getQuestionCountByLevel();
    if (result.success && result.data) {
      setCounts(result.data);
    }
  };

  const handleformDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "level" || name === "correctOption"
          ? parseInt(value)
          : value,
    }));
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.questionText ||
      !formData.optionA ||
      !formData.optionB ||
      !formData.optionC ||
      !formData.optionD
    ) {
      setSubmitMessage("❌ Please fill all fields");
      return;
    }

    const result = await addQuestion(
      formData.level,
      formData.category,
      formData.questionText,
      [formData.optionA, formData.optionB, formData.optionC, formData.optionD],
      formData.correctOption,
      formData.difficulty
    );

    if (result.success) {
      setSubmitMessage("✅ Question added successfully!");
      setFormData({
        level: selectedLevel,
        category: "Aptitude",
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: 1,
        difficulty: "Medium",
      });
      fetchQuestions();
      fetchCounts();
      setTimeout(() => setSubmitMessage(""), 3000);
    } else {
      setSubmitMessage(`❌ Error: ${result.message}`);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        fetchQuestions();
        fetchCounts();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Question Manager</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage questions for DRIVE 2.0 assessments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Level 1 — Aptitude</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{counts.level1}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><span className="text-xl">📝</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Level 2 — Coding</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{counts.level2}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><span className="text-xl">💻</span></div>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Question Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">
                Add New Question
              </h2>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleformDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Level 1 - Aptitude (MCQ)</option>
                    <option value={2}>Level 2 - Coding (DSA)</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleformDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Numbers">Numbers</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Ratio">Ratio & Proportion</option>
                    <option value="Time & Work">Time & Work</option>
                    <option value="Series">Series</option>
                    <option value="Coding-Decoding">Coding-Decoding</option>
                    <option value="DSA">Data Structures</option>
                    <option value="Algorithms">Algorithms</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleformDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <textarea
                    name="questionText"
                    value={formData.questionText}
                    onChange={handleformDataChange}
                    placeholder="Enter question text..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>

                {/* Options */}
                {["A", "B", "C", "D"].map((letter, idx) => (
                  <div key={letter}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option {letter}
                    </label>
                    <input
                      type="text"
                      name={`option${letter}`}
                      value={
                        formData[
                          `option${letter}` as keyof typeof formData
                        ]
                      }
                      onChange={handleformDataChange}
                      placeholder={`Option ${letter}`}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                ))}

                {/* Correct Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Option
                  </label>
                  <select
                    name="correctOption"
                    value={formData.correctOption}
                    onChange={handleformDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Option A</option>
                    <option value={2}>Option B</option>
                    <option value={3}>Option C</option>
                    <option value={4}>Option D</option>
                  </select>
                </div>

                {submitMessage && (
                  <div className={`p-3 rounded-xl text-sm font-medium ${
                    submitMessage.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {submitMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2.5 rounded-xl transition text-sm shadow-lg shadow-blue-600/20"
                >
                  Add Question
                </button>
              </form>
            </div>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                <div className="flex gap-2">
                  {[1, 2].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedLevel === level
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Level {level}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500">Loading questions...</p>
              ) : questions.length === 0 ? (
                <p className="text-gray-500">
                  No questions for Level {selectedLevel}. Add some!
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm text-gray-600">
                            ID: {q.id} • {q.category} • {q.difficulty}
                          </p>
                          <p className="text-gray-900 font-medium mt-1">
                            {q.question_text}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <p>
                          A){" "}
                          <span className={q.correct_option === 1 ? "font-bold text-green-600" : ""}>
                            {q.option_a}
                          </span>
                        </p>
                        <p>
                          B){" "}
                          <span className={q.correct_option === 2 ? "font-bold text-green-600" : ""}>
                            {q.option_b}
                          </span>
                        </p>
                        <p>
                          C){" "}
                          <span className={q.correct_option === 3 ? "font-bold text-green-600" : ""}>
                            {q.option_c}
                          </span>
                        </p>
                        <p>
                          D){" "}
                          <span className={q.correct_option === 4 ? "font-bold text-green-600" : ""}>
                            {q.option_d}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
