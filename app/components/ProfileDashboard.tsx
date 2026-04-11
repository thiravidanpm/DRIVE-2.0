"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUserWeeklyHistory, getCurrentWeek } from "@/app/actions/weekly";

interface WeeklyHistoryEntry {
  week_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export default function ProfileDashboard({
  userId,
  rollNumber,
}: {
  userId: number;
  rollNumber: string;
}) {
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryEntry[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [histRes, weekRes] = await Promise.all([
        getUserWeeklyHistory(userId),
        getCurrentWeek(),
      ]);

      if (histRes.success && histRes.data) {
        setWeeklyHistory(histRes.data);
        setTotalScore(histRes.totalScore || 0);
      }
      setCurrentWeek(weekRes.week);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const weeksCompleted = weeklyHistory.length;
  const bestScore = weeksCompleted > 0 ? Math.max(...weeklyHistory.map((h) => h.score)) : 0;
  const avgPercentage =
    weeksCompleted > 0
      ? Math.round(weeklyHistory.reduce((sum, h) => sum + h.percentage, 0) / weeksCompleted)
      : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Overview</h2>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm font-medium">Roll Number</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{rollNumber}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
            <p className="text-gray-600 text-sm font-medium">Current Week</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {loading ? "-" : `Week ${currentWeek}`}
            </p>
          </div>
        </div>

        {/* Total Points - Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-8 text-white text-center">
          <p className="text-lg font-medium opacity-90 mb-2">Total Points</p>
          <p className="text-6xl font-black">{loading ? "-" : totalScore}</p>
          <p className="text-sm opacity-75 mt-2">
            Accumulated across {weeksCompleted} week{weeksCompleted !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-600">
            <p className="text-gray-600 text-xs font-medium">Weeks Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{loading ? "-" : weeksCompleted}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-5 border-l-4 border-orange-600">
            <p className="text-gray-600 text-xs font-medium">Best Score</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{loading ? "-" : `${bestScore}/10`}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-5 border-l-4 border-cyan-600">
            <p className="text-gray-600 text-xs font-medium">Avg Percentage</p>
            <p className="text-3xl font-bold text-cyan-600 mt-1">{loading ? "-" : `${avgPercentage}%`}</p>
          </div>
          <div className="bg-rose-50 rounded-lg p-5 border-l-4 border-rose-600">
            <p className="text-gray-600 text-xs font-medium">Max Possible</p>
            <p className="text-3xl font-bold text-rose-600 mt-1">{loading ? "-" : weeksCompleted * 10}</p>
          </div>
        </div>

        {/* Weekly Score Breakdown */}
        {weeklyHistory.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Score Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Week</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Percentage</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyHistory.map((entry, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">Week {entry.week_number}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-blue-100 text-blue-900 px-3 py-1 rounded font-bold text-sm">
                          {entry.score}/{entry.total_questions}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          entry.percentage >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {entry.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(entry.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-purple-50 font-bold border-t-2 border-purple-300">
                    <td className="px-4 py-3 text-purple-900">Total</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-purple-100 text-purple-900 px-3 py-1 rounded font-bold text-sm">
                        {totalScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-800">
                        {avgPercentage}% avg
                      </span>
                    </td>
                    <td className="px-4 py-3 text-purple-700">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No test scores yet. Start with your first test!</p>
              <Link href="/dashboard/test/l1">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  Take First Test
                </button>
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
