"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import {
  getAllUsers,
  deleteUser,
  updateUserDetails,
  getUserStatistics,
  searchUsers,
  getUserWithScores,
} from "@/app/actions/admin";
import {
  getAllQuestions,
  deleteQuestion,
  addQuestion,
  getQuestionCountByLevel,
  syncQuestionsFromWebhook,
  getAllQuestionsForDownload,
} from "@/app/actions/questions";
import {
  getCurrentWeek,
  startNewWeek,
  getWeeklyCompletionStatus,
  resetUsersForWeek,
  getWeeklyLeaderboard,
  getCumulativeLeaderboard,
} from "@/app/actions/weekly";
import { formatQuestionForDownload } from "@/lib/webhookParser";

export default function SuperAdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "questions" | "weekly">("dashboard");
  const [users, setUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalScores: 0, totalProgress: 0 });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [syncMessage, setSyncMessage] = useState("");

  // Weekly system state
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weeklyCompleted, setWeeklyCompleted] = useState<{ user_id: number; roll_number: string; score: number; percentage: number }[]>([]);
  const [weeklyPending, setWeeklyPending] = useState<{ user_id: number; roll_number: string }[]>([]);
  const [selectedResetUsers, setSelectedResetUsers] = useState<Set<number>>(new Set());
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [cumulativeLeaderboard, setCumulativeLeaderboard] = useState<{roll_number:string;total_score:number;weeks_completed:number;avg_percentage:number}[]>([]);
  const [weeklyMessage, setWeeklyMessage] = useState("");

  // Konami code activation
  useKonamiCode(() => {
    setIsUnlocked(true);
  });

  useEffect(() => {
    if (isUnlocked) {
      loadDashboard();
    }
  }, [isUnlocked, activeTab]);

  const loadDashboard = async () => {
    setLoading(true);

    // Always load current week
    const weekRes = await getCurrentWeek();
    setCurrentWeek(weekRes.week);

    if (activeTab === "dashboard") {
      const statResult = await getUserStatistics();
      if (statResult.success && statResult.data) {
        setStats(statResult.data);
      }
    } else if (activeTab === "users") {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data || []);
      }
    } else if (activeTab === "questions") {
      const result = await getAllQuestions(selectedLevel);
      if (result.success) {
        setQuestions(result.data || []);
      }
    } else if (activeTab === "weekly") {
      const statusRes = await getWeeklyCompletionStatus(weekRes.week);
      if (statusRes.success) {
        setWeeklyCompleted(statusRes.completed);
        setWeeklyPending(statusRes.pending);
      }
      const lbRes = await getWeeklyLeaderboard(weekRes.week);
      if (lbRes.success && lbRes.data) {
        setWeeklyLeaderboard(lbRes.data);
      }
      const cumRes = await getCumulativeLeaderboard();
      if (cumRes.success && cumRes.data) {
        setCumulativeLeaderboard(cumRes.data);
      }
    }

    setLoading(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(users.filter((u) => u.id !== userId));
      }
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (window.confirm("Delete this question?")) {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        setQuestions(questions.filter((q) => q.id !== questionId));
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDashboard();
      return;
    }

    setLoading(true);
    const result = await searchUsers(searchQuery);
    if (result.success) {
      setUsers(result.data || []);
    }
    setLoading(false);
  };

  const handleViewUserDetails = async (userId: number) => {
    const result = await getUserWithScores(userId);
    if (result.success) {
      setSelectedUser(result.data);
    }
  };

  const handleSyncQuestions = async () => {
    setSyncing(true);
    setSyncMessage("");
    setSyncProgress(0);

    try {
      const result = await syncQuestionsFromWebhook();

      setSyncProgress(100);

      if (result.success) {
        const details = result.data
          ? ` (Added: ${result.data.added}, Duplicates: ${result.data.duplicates})`
          : "";
        setSyncMessage(`✅ ${result.message}${details}`);
        
        // Reload questions after delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        loadDashboard();
      } else {
        let errorMsg = result.message;
        if (result.data?.errors && result.data.errors.length > 0) {
          errorMsg += `\n\nDetails:\n${result.data.errors.slice(0, 3).join("\n")}`;
          if (result.data.errors.length > 3) {
            errorMsg += `\n... and ${result.data.errors.length - 3} more errors`;
          }
        }
        setSyncMessage(`❌ Sync Failed:\n${errorMsg}`);
      }
    } catch (error: any) {
      setSyncProgress(0);
      setSyncMessage(`❌ Error: ${error.message}`);
    }

    setTimeout(() => {
      setSyncing(false);
      setSyncProgress(0);
    }, 3000);
  };

  const handleDownloadQuestions = async () => {
    try {
      const result = await getAllQuestionsForDownload(selectedLevel);
      if (result.success && result.data) {
        const text = formatQuestionForDownload(result.data);

        // Create blob and download
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `questionset_level${selectedLevel}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleStartNewWeek = async () => {
    if (!window.confirm(`Start Week ${currentWeek + 1}? This will allow all students to take the test again. Make sure you have generated new questions first.`)) {
      return;
    }
    setLoading(true);
    setWeeklyMessage("");
    const result = await startNewWeek();
    if (result.success) {
      setCurrentWeek(result.newWeek || currentWeek + 1);
      setWeeklyMessage(`✅ ${result.message}`);
      await loadDashboard();
    } else {
      setWeeklyMessage(`❌ ${result.message}`);
    }
    setLoading(false);
  };

  const handleToggleResetUser = (userId: number) => {
    setSelectedResetUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllCompleted = () => {
    if (selectedResetUsers.size === weeklyCompleted.length) {
      setSelectedResetUsers(new Set());
    } else {
      setSelectedResetUsers(new Set(weeklyCompleted.map((u) => u.user_id)));
    }
  };

  const handleResetSelectedUsers = async () => {
    if (selectedResetUsers.size === 0) return;
    if (!window.confirm(`Reset ${selectedResetUsers.size} user(s) for Week ${currentWeek}? They will be able to retake the test.`)) {
      return;
    }
    setLoading(true);
    setWeeklyMessage("");
    const result = await resetUsersForWeek(Array.from(selectedResetUsers), currentWeek);
    if (result.success) {
      setWeeklyMessage(`✅ ${result.message}`);
      setSelectedResetUsers(new Set());
      await loadDashboard();
    } else {
      setWeeklyMessage(`❌ ${result.message}`);
    }
    setLoading(false);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🔒 Access Restricted</h1>
          <p className="text-gray-400 text-lg mb-8">
            This area requires special authentication.
          </p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-300">Authorized personnel only.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">🎮 Super Admin Dashboard</h1>
              <p className="text-gray-400 mt-1">Full Control Panel • All Privileges</p>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                Back to Dashboard
              </button>
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {["dashboard", "users", "questions", "weekly"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  setSelectedUser(null);
                }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {tab === "dashboard" && "📊 Dashboard"}
                {tab === "users" && "👥 Users"}
                {tab === "questions" && "❓ Questions"}
                {tab === "weekly" && `📅 Week ${currentWeek}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Total Test Submissions</p>
                <p className="text-4xl font-bold text-green-600">{stats.totalScores}</p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">User Progress Entries</p>
                <p className="text-4xl font-bold text-orange-600">{stats.totalProgress}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                >
                  <p className="font-semibold text-blue-900">Manage Users</p>
                  <p className="text-sm text-blue-700">Add, Edit, Delete users</p>
                </button>

                <button
                  onClick={() => setActiveTab("questions")}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                >
                  <p className="font-semibold text-green-900">Manage Questions</p>
                  <p className="text-sm text-green-700">CRUD operations</p>
                </button>

                <Link href="/admin/questions" className="block">
                  <button className="w-full p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition">
                    <p className="font-semibold text-purple-900">Add Questions Panel</p>
                    <p className="text-sm text-purple-700">Dedicated form</p>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && !selectedUser && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>

              {/* Search */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Search by Roll Number or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Search
                </button>
                <button
                  onClick={loadDashboard}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600">Loading users...</p>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-600">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.roll_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => handleViewUserDetails(user.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* User Details */}
        {activeTab === "users" && selectedUser && (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                User: {selectedUser.user.roll_number}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">User Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-mono text-gray-900">{selectedUser.user.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Roll Number</p>
                      <p className="font-mono text-gray-900">{selectedUser.user.roll_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Joined</p>
                      <p className="text-gray-900">
                        {new Date(selectedUser.user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Performance</h4>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Total Submissions</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedUser.scores.length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Levels Attempted</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedUser.progress.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser.scores.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Scores</h4>
                  <div className="space-y-2">
                    {selectedUser.scores.slice(0, 5).map((score: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded"
                      >
                        <span className="text-gray-900">Level {score.level}</span>
                        <span className="font-bold text-blue-600">{score.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions Management</h2>

            {/* Sync Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Generate - Smart Question Sync</h3>
                    <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                      Generates fresh aptitude questions using Groq AI and adds them to Level 1. The system will:
                      <br />• Pick random topics from 41 IndiaBIX categories
                      <br />• Generate unique questions with AI (Llama 3.3 70B)
                      <br />• Validate question format and options
                      <br />• Remove duplicates automatically
                      <br />• Insert new questions into the database
                      <br />• Handle all errors gracefully
                    </p>
                    {syncing && (
                      <div>
                        <div className="mb-2 text-sm font-semibold text-blue-900">
                          ⏱️ Syncing... {syncProgress}%
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-700 h-2.5 rounded-full transition-all"
                            style={{ width: `${syncProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">Please wait, this may take up to 2 minutes...</p>
                      </div>
                    )}
                    {syncMessage && (
                      <div className={`mt-4 p-4 rounded-lg text-sm font-medium whitespace-pre-wrap border ${
                        syncMessage.startsWith("✅")
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}>
                        {syncMessage}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSyncQuestions}
                    disabled={syncing}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold whitespace-nowrap h-fit"
                  >
                    {syncing ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Syncing...
                      </>
                    ) : (
                      "Generate New Questions"
                    )}
                  </button>
                </div>
              </div>

            {/* Filter and Actions */}
            <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setSelectedLevel(level);
                      setQuestions([]);
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      selectedLevel === level
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Level {level}
                  </button>
                ))}

                <button
                  onClick={handleDownloadQuestions}
                  className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  ⬇️ Download Questions
                </button>
              </div>

            {loading ? (
              <p className="text-gray-600">Loading questions...</p>
            ) : questions.length === 0 ? (
              <p className="text-gray-600">No questions for Level {selectedLevel}</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-600">
                          ID: {q.id} • {q.category} • {q.difficulty}
                        </p>
                        <p className="font-semibold text-gray-900 mt-2">{q.question_text}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        A){" "}
                        <span
                          className={
                            q.correct_option === 1 ? "font-bold text-green-600" : ""
                          }
                        >
                          {q.option_a}
                        </span>
                      </p>
                      <p>
                        B){" "}
                        <span
                          className={
                            q.correct_option === 2 ? "font-bold text-green-600" : ""
                          }
                        >
                          {q.option_b}
                        </span>
                      </p>
                      <p>
                        C){" "}
                        <span
                          className={
                            q.correct_option === 3 ? "font-bold text-green-600" : ""
                          }
                        >
                          {q.option_c}
                        </span>
                      </p>
                      <p>
                        D){" "}
                        <span
                          className={
                            q.correct_option === 4 ? "font-bold text-green-600" : ""
                          }
                        >
                          {q.option_d}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weekly Tab */}
        {activeTab === "weekly" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Week {currentWeek} Management</h2>
              <button
                onClick={handleStartNewWeek}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
              >
                🔄 Start New Week (Week {currentWeek + 1})
              </button>
            </div>

            {weeklyMessage && (
              <div className={`p-4 rounded-lg text-sm font-medium border ${
                weeklyMessage.startsWith("✅")
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}>
                {weeklyMessage}
              </div>
            )}

            {/* Completion Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold text-green-600">{weeklyCompleted.length}</p>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-4xl font-bold text-yellow-600">{weeklyPending.length}</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Total Students</p>
                <p className="text-4xl font-bold text-blue-600">{weeklyCompleted.length + weeklyPending.length}</p>
              </div>
            </div>

            {/* Completed Users - with reset selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  ✅ Completed ({weeklyCompleted.length})
                </h3>
                {weeklyCompleted.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllCompleted}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                    >
                      {selectedResetUsers.size === weeklyCompleted.length ? "Deselect All" : "Select All"}
                    </button>
                    <button
                      onClick={handleResetSelectedUsers}
                      disabled={selectedResetUsers.size === 0 || loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm font-semibold"
                    >
                      🔁 Reset Selected ({selectedResetUsers.size})
                    </button>
                  </div>
                )}
              </div>

              {weeklyCompleted.length === 0 ? (
                <p className="text-gray-500">No students have completed this week&apos;s test yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {weeklyCompleted.map((u) => (
                    <div
                      key={u.user_id}
                      onClick={() => handleToggleResetUser(u.user_id)}
                      className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition border ${
                        selectedResetUsers.has(u.user_id)
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedResetUsers.has(u.user_id)}
                          onChange={() => handleToggleResetUser(u.user_id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="font-semibold text-gray-900">{u.roll_number}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-blue-600 font-bold">{u.score}/10</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.score >= 7 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {u.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ⏳ Pending ({weeklyPending.length})
              </h3>
              {weeklyPending.length === 0 ? (
                <p className="text-gray-500">All students have completed this week&apos;s test!</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {weeklyPending.map((u) => (
                    <span
                      key={u.user_id}
                      className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 font-medium"
                    >
                      {u.roll_number}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Leaderboard */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Week {currentWeek} Leaderboard</h3>
              {weeklyLeaderboard.length === 0 ? (
                <p className="text-gray-500">No results yet for this week.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyLeaderboard.map((entry, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{entry.roll_number}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{entry.score}/10</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            entry.percentage >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {entry.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Cumulative Total Leaderboard */}
            <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏅 Cumulative Total Leaderboard (All Weeks)</h3>
              {cumulativeLeaderboard.length === 0 ? (
                <p className="text-gray-500">No cumulative data yet.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-purple-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Weeks</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Avg %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cumulativeLeaderboard.map((entry, idx) => (
                      <tr key={idx} className="border-b hover:bg-purple-50">
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{entry.roll_number}</td>
                        <td className="px-4 py-3 font-bold text-purple-600 text-lg">{entry.total_score}</td>
                        <td className="px-4 py-3 text-gray-700">{entry.weeks_completed}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            entry.avg_percentage >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {entry.avg_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
