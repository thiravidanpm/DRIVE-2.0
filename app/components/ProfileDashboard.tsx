"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUserWeeklyHistory, getCurrentWeek } from "@/app/actions/weekly";
import { getUserL2History, getL2CurrentWeek } from "@/app/actions/l2";

interface WeeklyHistoryEntry {
  week_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

interface L2HistoryEntry {
  week_number: number;
  problems_solved: number;
  total_problems: number;
  score: number;
  completed_at: string;
}

type ProfileTab = "L1" | "L2" | "Both";

export default function ProfileDashboard({
  userId,
  rollNumber,
}: {
  userId: number;
  rollNumber: string;
}) {
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryEntry[]>([]);
  const [l2History, setL2History] = useState<L2HistoryEntry[]>([]);
  const [l1Total, setL1Total] = useState(0);
  const [l2Total, setL2Total] = useState(0);
  const [l1Week, setL1Week] = useState(1);
  const [l2Week, setL2Week] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>("Both");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [histRes, l2HistRes, weekRes, l2WeekRes] = await Promise.all([
        getUserWeeklyHistory(userId),
        getUserL2History(userId),
        getCurrentWeek(),
        getL2CurrentWeek(),
      ]);

      if (histRes.success && histRes.data) {
        setWeeklyHistory(histRes.data);
        setL1Total(histRes.totalScore || 0);
      }
      if (l2HistRes.success && l2HistRes.data) {
        setL2History(l2HistRes.data);
        setL2Total(l2HistRes.totalScore || 0);
      }
      setL1Week(weekRes.week);
      setL2Week(l2WeekRes.week);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const l1WeeksDone = weeklyHistory.length;
  const l2WeeksDone = l2History.length;
  const l1Best = l1WeeksDone > 0 ? Math.max(...weeklyHistory.map((h) => h.score)) : 0;
  const l1Avg = l1WeeksDone > 0 ? Math.round(weeklyHistory.reduce((sum, h) => sum + h.percentage, 0) / l1WeeksDone) : 0;
  const l2Best = l2WeeksDone > 0 ? Math.max(...l2History.map((h) => h.score)) : 0;
  const l2TotalSolved = l2History.reduce((sum, h) => sum + h.problems_solved, 0);
  const combinedTotal = l1Total + l2Total;

  return (
    <div className="space-y-6">
      {/* Total Points Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Total Points (L1 + L2)</p>
            <p className="text-5xl font-black">{loading ? "—" : combinedTotal}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-white/60 text-sm bg-white/10 px-3 py-1 rounded-lg">L1: {l1Total}</span>
              <span className="text-white/60 text-sm bg-white/10 px-3 py-1 rounded-lg">L2: {l2Total}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10">
              <p className="text-2xl font-bold">{loading ? "—" : rollNumber}</p>
              <p className="text-xs text-white/60 mt-1">Roll Number</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10">
              <p className="text-2xl font-bold">{loading ? "—" : `W${l1Week}`}</p>
              <p className="text-xs text-white/60 mt-1">L1 Week</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10">
              <p className="text-2xl font-bold">{loading ? "—" : `W${l2Week}`}</p>
              <p className="text-xs text-white/60 mt-1">L2 Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "L1 Weeks Done", value: loading ? "—" : l1WeeksDone, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "L1 Best Score", value: loading ? "—" : `${l1Best}/10`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
          { label: "L2 Problems Solved", value: loading ? "—" : l2TotalSolved, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
          { label: "L2 Best Week Score", value: loading ? "—" : l2Best, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-5 border ${stat.border}`}>
            <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Selector + Score Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Score Breakdown</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["Both", "L1", "L2"] as ProfileTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
                  tab === t
                    ? t === "L1" ? "bg-blue-600 text-white shadow-sm"
                      : t === "L2" ? "bg-green-600 text-white shadow-sm"
                      : "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t === "Both" ? "L1+L2" : t}
              </button>
            ))}
          </div>
        </div>

        {/* L1 Table */}
        {(tab === "L1" || tab === "Both") && weeklyHistory.length > 0 && (
          <div>
            {tab === "Both" && (
              <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">L1 — Aptitude Assessments</p>
              </div>
            )}
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
                  <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-200">
                    <td className="px-6 py-3.5 text-blue-900">L1 Total</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-xs">
                        {l1Total}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                        {l1Avg}% avg
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-blue-600 text-xs">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* L2 Table */}
        {(tab === "L2" || tab === "Both") && l2History.length > 0 && (
          <div>
            {tab === "Both" && (
              <div className="px-6 py-2 bg-green-50 border-b border-green-100 border-t border-t-gray-200">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">L2 — Coding Assessments</p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Solved</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {l2History.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5 text-gray-900 font-medium">Week {entry.week_number}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold text-xs">
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {entry.problems_solved}/{entry.total_problems}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs">
                        {new Date(entry.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-50/50 font-bold border-t-2 border-green-200">
                    <td className="px-6 py-3.5 text-green-900">L2 Total</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold text-xs">
                        {l2Total}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-green-100 text-green-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {l2TotalSolved} solved
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-green-600 text-xs">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Combined Total Row */}
        {tab === "Both" && (weeklyHistory.length > 0 || l2History.length > 0) && (
          <div className="px-6 py-4 bg-purple-50 border-t-2 border-purple-200 flex items-center justify-between">
            <span className="text-purple-900 font-bold text-sm">Combined Total</span>
            <span className="inline-flex items-center bg-purple-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm">
              {combinedTotal} points
            </span>
          </div>
        )}

        {/* Empty state */}
        {!loading && weeklyHistory.length === 0 && l2History.length === 0 && (
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
        )}
        {!loading && tab === "L1" && weeklyHistory.length === 0 && (
          <div className="text-center py-12 px-6">
            <p className="text-gray-500 text-sm">No L1 scores yet. Take an aptitude test to see results here.</p>
          </div>
        )}
        {!loading && tab === "L2" && l2History.length === 0 && (
          <div className="text-center py-12 px-6">
            <p className="text-gray-500 text-sm">No L2 scores yet. Solve coding problems to see results here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
