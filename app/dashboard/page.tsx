"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProfileDashboard from "@/app/components/ProfileDashboard";
import TestGateway from "@/app/components/TestGateway";
import LeaderboardSection from "@/app/components/LeaderboardSection";

export default function DashboardPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [rollNumber, setRollNumber] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"profile" | "test" | "leaderboard">(
    "profile"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedRollNumber = localStorage.getItem("rollNumber");

    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }

    setUserId(parseInt(storedUserId));
    setRollNumber(storedRollNumber || "");
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("rollNumber");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">D</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Welcome, {rollNumber}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/admin/superadmin">
              <button className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium">
                🎮 Admin
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { key: "profile" as const, label: "📊 Profile", },
              { key: "test" as const, label: "📝 Assessments", },
              { key: "leaderboard" as const, label: "🏆 Leaderboard", },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === "profile" && (
            <ProfileDashboard userId={userId} rollNumber={rollNumber} />
          )}
          {activeTab === "test" && <TestGateway />}
          {activeTab === "leaderboard" && <LeaderboardSection />}
        </div>
      </main>
    </div>
  );
}
