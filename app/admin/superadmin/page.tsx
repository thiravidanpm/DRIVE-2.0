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
import {
  getL2CurrentWeek,
  startNewL2Week,
  getAllL2Problems,
  getL2WeekProblems,
  assignProblemsToWeek,
  autoAssignNextWeek,
  getL2CompletionStatus,
  resetL2UsersForWeek,
  getL2CumulativeLeaderboard,
  importL2Problems,
  getL2PulledWeeks,
  pullL2Week,
  unpullL2Week,
} from "@/app/actions/l2";
import { inviteCollaborator, getCollaborators, removeCollaborator } from "@/app/actions/github";
import { formatQuestionForDownload } from "@/lib/webhookParser";

export default function SuperAdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "questions" | "weekly" | "l2">("dashboard");
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

  // L2 Coding state
  const [l2Week, setL2Week] = useState(1);
  const [l2Problems, setL2Problems] = useState<any[]>([]);
  const [l2WeekProblems, setL2WeekProblems] = useState<any[]>([]);
  const [l2Completed, setL2Completed] = useState<any[]>([]);
  const [l2Pending, setL2Pending] = useState<any[]>([]);
  const [l2CumLeaderboard, setL2CumLeaderboard] = useState<any[]>([]);
  const [l2Message, setL2Message] = useState("");
  const [l2SelectedResetUsers, setL2SelectedResetUsers] = useState<Set<number>>(new Set());
  const [l2ImportText, setL2ImportText] = useState("");
  const [l2PulledWeeks, setL2PulledWeeks] = useState<number[]>([]);

  // Developers section state
  const [showDevDialog, setShowDevDialog] = useState(false);
  const [devInput, setDevInput] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devMessage, setDevMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [collaborators, setCollaborators] = useState<{ login: string; avatar_url: string; permissions: any }[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);

  const handleInviteCollaborator = async () => {
    if (!devInput.trim()) return;
    setDevLoading(true);
    setDevMessage(null);
    const result = await inviteCollaborator(devInput.trim());
    setDevMessage({ text: result.message, type: result.success ? "success" : "error" });
    if (result.success) {
      setDevInput("");
      loadCollaborators();
    }
    setDevLoading(false);
  };

  const loadCollaborators = async () => {
    setCollabLoading(true);
    const res = await getCollaborators();
    if (res.success && res.data) setCollaborators(res.data);
    setCollabLoading(false);
  };

  const handleRemoveCollaborator = async (username: string) => {
    if (!window.confirm(`Remove @${username} from collaborators?`)) return;
    const result = await removeCollaborator(username);
    setDevMessage({ text: result.message, type: result.success ? "success" : "error" });
    if (result.success) loadCollaborators();
  };

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
    } else if (activeTab === "l2") {
      const l2WeekRes = await getL2CurrentWeek();
      setL2Week(l2WeekRes.week);
      const allProbs = await getAllL2Problems();
      if (allProbs.success && allProbs.data) setL2Problems(allProbs.data);
      const weekProbs = await getL2WeekProblems(l2WeekRes.week);
      if (weekProbs.success && weekProbs.data) setL2WeekProblems(weekProbs.data);
      const l2Status = await getL2CompletionStatus(l2WeekRes.week);
      if (l2Status.success) {
        setL2Completed(l2Status.completed);
        setL2Pending(l2Status.pending);
      }
      const l2Cum = await getL2CumulativeLeaderboard();
      if (l2Cum.success && l2Cum.data) setL2CumLeaderboard(l2Cum.data);
      const pulledRes = await getL2PulledWeeks();
      if (pulledRes.success) setL2PulledWeeks(pulledRes.pulledWeeks);
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

  // ========== L2 HANDLERS ==========

  const handleStartNewL2Week = async () => {
    if (!window.confirm(`Start L2 Week ${l2Week + 1}? Make sure problems are assigned for the next week.`)) return;
    setLoading(true);
    setL2Message("");
    const result = await startNewL2Week();
    if (result.success) {
      setL2Week(result.newWeek || l2Week + 1);
      setL2Message(`✅ ${result.message}`);
      await loadDashboard();
    } else {
      setL2Message(`❌ ${result.message}`);
    }
    setLoading(false);
  };

  const handleAutoAssignL2 = async () => {
    setLoading(true);
    setL2Message("");
    const result = await autoAssignNextWeek();
    if (result.success) {
      setL2Message(`✅ ${result.message}`);
      await loadDashboard();
    } else {
      setL2Message(`❌ ${result.message}`);
    }
    setLoading(false);
  };

  const handleToggleL2ResetUser = (userId: number) => {
    setL2SelectedResetUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllL2Completed = () => {
    if (l2SelectedResetUsers.size === l2Completed.length) {
      setL2SelectedResetUsers(new Set());
    } else {
      setL2SelectedResetUsers(new Set(l2Completed.map((u: any) => u.user_id)));
    }
  };

  const handleResetL2SelectedUsers = async () => {
    if (l2SelectedResetUsers.size === 0) return;
    if (!window.confirm(`Reset ${l2SelectedResetUsers.size} L2 user(s) for Week ${l2Week}?`)) return;
    setLoading(true);
    setL2Message("");
    const result = await resetL2UsersForWeek(Array.from(l2SelectedResetUsers), l2Week);
    if (result.success) {
      setL2Message(`✅ ${result.message}`);
      setL2SelectedResetUsers(new Set());
      await loadDashboard();
    } else {
      setL2Message(`❌ ${result.message}`);
    }
    setLoading(false);
  };

  const handleImportL2Problems = async () => {
    if (!l2ImportText.trim()) {
      setL2Message("❌ Paste problem JSON data first.");
      return;
    }
    setLoading(true);
    setL2Message("");
    try {
      const problems = JSON.parse(l2ImportText);
      const result = await importL2Problems(Array.isArray(problems) ? problems : [problems]);
      if (result.success) {
        setL2Message(`✅ ${result.message}`);
        setL2ImportText("");
        await loadDashboard();
      } else {
        setL2Message(`❌ ${result.message}`);
      }
    } catch {
      setL2Message("❌ Invalid JSON format. Check the data and try again.");
    }
    setLoading(false);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-gray-500 text-sm mb-8">
            This area requires special authentication.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-sm mx-auto">
            <p className="text-gray-400 text-sm">Authorized personnel only.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">🎮 Super Admin</h1>
              <p className="text-gray-400 text-xs mt-1">Full Control Panel</p>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition border border-white/10">
                ← Dashboard
              </button>
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1.5 flex-wrap">
            {["dashboard", "users", "questions", "weekly", "l2"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  setSelectedUser(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                }`}
              >
                {tab === "dashboard" && "📊 Overview"}
                {tab === "users" && "👥 Users"}
                {tab === "questions" && "❓ Questions"}
                {tab === "weekly" && `📅 L1 Week ${currentWeek}`}
                {tab === "l2" && `💻 L2 Week ${l2Week}`}
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

                <button
                  onClick={() => { setShowDevDialog(true); loadCollaborators(); }}
                  className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition"
                >
                  <p className="font-semibold text-white">🛠 Developers</p>
                  <p className="text-sm text-gray-300">Invite collaborators</p>
                </button>
              </div>
            </div>

            {/* Developers Dialog */}
            {showDevDialog && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDevDialog(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">🛠</div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Invite Collaborator</h3>
                        <p className="text-gray-400 text-xs">Add developers to the repository</p>
                      </div>
                    </div>
                    <button onClick={() => setShowDevDialog(false)} className="text-gray-400 hover:text-white transition text-xl">✕</button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Invite Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub Username or Email</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                          <input
                            type="text"
                            value={devInput}
                            onChange={(e) => setDevInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleInviteCollaborator()}
                            placeholder="username or email@example.com"
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                          />
                        </div>
                        <button
                          onClick={handleInviteCollaborator}
                          disabled={devLoading || !devInput.trim()}
                          className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {devLoading ? "Sending..." : "Invite"}
                        </button>
                      </div>
                    </div>

                    {/* Status Message */}
                    {devMessage && (
                      <div className={`p-3 rounded-xl text-sm font-medium ${
                        devMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {devMessage.text}
                      </div>
                    )}

                    {/* Collaborators List */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Collaborators</h4>
                      {collabLoading ? (
                        <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                      ) : collaborators.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">No collaborators yet, or GitHub not configured</div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {collaborators.map((c) => (
                            <div key={c.login} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-3">
                                <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full" />
                                <div>
                                  <span className="font-semibold text-gray-900 text-sm">@{c.login}</span>
                                  <span className="ml-2 text-xs text-gray-400">
                                    {c.permissions?.admin ? "Admin" : c.permissions?.push ? "Write" : "Read"}
                                  </span>
                                </div>
                              </div>
                              {!c.permissions?.admin && (
                                <button
                                  onClick={() => handleRemoveCollaborator(c.login)}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Setup note */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Setup:</span> Add <code className="bg-gray-200 px-1 rounded">GITHUB_TOKEN</code>, <code className="bg-gray-200 px-1 rounded">GITHUB_REPO_OWNER</code>, and <code className="bg-gray-200 px-1 rounded">GITHUB_REPO_NAME</code> to your .env.local file. The token needs <code className="bg-gray-200 px-1 rounded">repo</code> scope.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm text-gray-900 placeholder-gray-400"
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
                {[1, 2].map((level) => (
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

        {/* L2 Coding Tab */}
        {activeTab === "l2" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">L2 Coding — Week {l2Week}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleAutoAssignL2}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
                >
                  🎯 Auto-Assign Next 4
                </button>
                <button
                  onClick={handleStartNewL2Week}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
                >
                  🔄 Start Week {l2Week + 1}
                </button>
              </div>
            </div>

            {l2Message && (
              <div className={`p-4 rounded-lg text-sm font-medium border ${
                l2Message.startsWith("✅")
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}>
                {l2Message}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 border-l-4 border-indigo-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Total Problems</p>
                <p className="text-4xl font-bold text-indigo-600">{l2Problems.length}</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">This Week</p>
                <p className="text-4xl font-bold text-blue-600">{l2WeekProblems.length}</p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold text-green-600">{l2Completed.length}</p>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-6">
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-4xl font-bold text-yellow-600">{l2Pending.length}</p>
              </div>
            </div>

            {/* This Week's Problems */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Week {l2Week} Problems</h3>
              {l2WeekProblems.length === 0 ? (
                <p className="text-gray-500">No problems assigned to this week. Click &quot;Auto-Assign Next 4&quot; to assign.</p>
              ) : (
                <div className="space-y-3">
                  {l2WeekProblems.map((p: any, idx: number) => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-sm text-gray-500 mr-2">#{idx + 1}</span>
                        <span className="font-semibold text-gray-900">{p.title}</span>
                        <span className={`ml-3 px-2 py-0.5 rounded text-xs font-bold ${
                          p.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                          p.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>{p.difficulty}</span>
                      </div>
                      <span className="text-sm text-gray-500">{p.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pull Older Weeks */}
            <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🔄 Pull Older Weeks</h3>
              <p className="text-sm text-gray-500 mb-4">
                Pull older week questions so students can attempt them alongside current week. Only weeks before Week {l2Week} can be pulled.
              </p>
              {l2PulledWeeks.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Currently Pulled:</p>
                  <div className="flex flex-wrap gap-2">
                    {l2PulledWeeks.map((w) => (
                      <span key={w} className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 border border-purple-300 rounded-lg text-sm text-purple-800 font-semibold">
                        Week {w}
                        <button
                          onClick={async () => {
                            const res = await unpullL2Week(w);
                            setL2Message(res.success ? `✅ ${res.message}` : `❌ ${res.message}`);
                            const pulledRes = await getL2PulledWeeks();
                            if (pulledRes.success) setL2PulledWeeks(pulledRes.pulledWeeks);
                          }}
                          className="text-purple-600 hover:text-red-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.max(0, l2Week - 1) }, (_, i) => i + 1)
                  .filter((w) => !l2PulledWeeks.includes(w))
                  .map((w) => (
                    <button
                      key={w}
                      onClick={async () => {
                        setLoading(true);
                        const res = await pullL2Week(w);
                        setL2Message(res.success ? `✅ ${res.message}` : `❌ ${res.message}`);
                        const pulledRes = await getL2PulledWeeks();
                        if (pulledRes.success) setL2PulledWeeks(pulledRes.pulledWeeks);
                        setLoading(false);
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition text-sm font-semibold"
                    >
                      Pull Week {w}
                    </button>
                  ))}
                {l2Week <= 1 && (
                  <p className="text-gray-400 text-sm italic">No older weeks available to pull yet (currently on Week 1).</p>
                )}
              </div>
            </div>

            {/* Completed L2 Users with reset */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">✅ Completed ({l2Completed.length})</h3>
                {l2Completed.length > 0 && (
                  <div className="flex gap-2">
                    <button onClick={handleSelectAllL2Completed} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">
                      {l2SelectedResetUsers.size === l2Completed.length ? "Deselect All" : "Select All"}
                    </button>
                    <button onClick={handleResetL2SelectedUsers} disabled={l2SelectedResetUsers.size === 0 || loading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm font-semibold">
                      🔁 Reset Selected ({l2SelectedResetUsers.size})
                    </button>
                  </div>
                )}
              </div>
              {l2Completed.length === 0 ? (
                <p className="text-gray-500">No students have completed this week&apos;s L2 coding test yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {l2Completed.map((u: any) => (
                    <div key={u.user_id} onClick={() => handleToggleL2ResetUser(u.user_id)} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition border ${l2SelectedResetUsers.has(u.user_id) ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={l2SelectedResetUsers.has(u.user_id)} onChange={() => handleToggleL2ResetUser(u.user_id)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="font-semibold text-gray-900">{u.roll_number}</span>
                      </div>
                      <span className="text-blue-600 font-bold">{u.problems_solved}/{u.total_problems} solved</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending L2 Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⏳ Pending ({l2Pending.length})</h3>
              {l2Pending.length === 0 ? (
                <p className="text-gray-500">All students have completed this week&apos;s L2 coding test!</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {l2Pending.map((u: any) => (
                    <span key={u.user_id} className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 font-medium">{u.roll_number}</span>
                  ))}
                </div>
              )}
            </div>

            {/* L2 Cumulative Leaderboard */}
            <div className="bg-white rounded-lg border-2 border-indigo-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏅 L2 Cumulative Leaderboard</h3>
              {l2CumLeaderboard.length === 0 ? (
                <p className="text-gray-500">No L2 cumulative data yet.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-indigo-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Weeks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l2CumLeaderboard.map((entry: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-indigo-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{entry.roll_number}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600 text-lg">{entry.total_score}</td>
                        <td className="px-4 py-3 text-gray-700">{entry.weeks_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Import Problems */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">📥 Import Problems (JSON)</h3>
              <p className="text-sm text-gray-500 mb-3">
                Paste a JSON array of problems. Each object needs: title, description, category, difficulty, test_cases (array of {`{input, expected_output}`}), starter_code ({`{python, java, c}`}).
              </p>
              <textarea
                value={l2ImportText}
                onChange={(e) => setL2ImportText(e.target.value)}
                placeholder={`[{\n  "title": "Two Sum",\n  "description": "Given an array...",\n  "category": "Arrays",\n  "difficulty": "Easy",\n  "test_cases": [{"input": "4\\n2 7 11 15\\n9", "expected_output": "0 1"}],\n  "starter_code": {"python": "def solve():\\n    pass", "java": "...", "c": "..."}\n}]`}
                rows={8}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleImportL2Problems}
                disabled={loading || !l2ImportText.trim()}
                className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
              >
                Import Problems
              </button>
            </div>

            {/* All Problems Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📚 All Problems ({l2Problems.length})</h3>
              {l2Problems.length === 0 ? (
                <p className="text-gray-500">No problems imported yet. Use the import tool above or seed from the script.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {l2Problems.map((p: any, idx: number) => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-8">#{idx + 1}</span>
                        <span className="font-medium text-gray-900">{p.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          p.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                          p.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>{p.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{p.category}</span>
                        <span className="text-xs text-gray-400">
                          {p.week_number ? `W${p.week_number}` : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
