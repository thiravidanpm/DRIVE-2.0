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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {rollNumber}</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/admin/superadmin">
              <button className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                🎮 Admin
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("test")}
              className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === "test"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === "leaderboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
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
