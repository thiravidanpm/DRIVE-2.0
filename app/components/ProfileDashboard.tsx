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
      {/* Total Points Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Total Points Accumulated</p>
            <p className="text-5xl font-black">{loading ? "—" : totalScore}</p>
            <p className="text-white/60 text-sm mt-2">
              Across {weeksCompleted} week{weeksCompleted !== 1 ? "s" : ""} of L1 assessments
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10">
              <p className="text-2xl font-bold">{loading ? "—" : rollNumber}</p>
              <p className="text-xs text-white/60 mt-1">Roll Number</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10">
              <p className="text-2xl font-bold">{loading ? "—" : `W${currentWeek}`}</p>
              <p className="text-xs text-white/60 mt-1">Current Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Weeks Done", value: loading ? "—" : weeksCompleted, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
          { label: "Best Score", value: loading ? "—" : `${bestScore}/10`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
          { label: "Avg Score", value: loading ? "—" : `${avgPercentage}%`, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
          { label: "Max Possible", value: loading ? "—" : weeksCompleted * 10, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-5 border ${stat.border}`}>
            <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly Score Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">{weeklyHistory.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Weekly Score Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklyHistory.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5 text-gray-900 font-medium">Week {entry.week_number}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-xs">
                          {entry.score}/{entry.total_questions}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          entry.percentage >= 70 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                        }`}>
                          {entry.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs">
                        {new Date(entry.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-purple-50/50 font-bold border-t-2 border-purple-200">
                    <td className="px-6 py-3.5 text-purple-900">Total</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-bold text-xs">
                        {totalScore}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
                        {avgPercentage}% avg
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-purple-600 text-xs">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          !loading && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-gray-600 font-medium mb-2">No test scores yet</p>
              <p className="text-gray-400 text-sm mb-6">Start with your first assessment to see results here</p>
              <Link href="/dashboard/test/l1">
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-600/20">
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
