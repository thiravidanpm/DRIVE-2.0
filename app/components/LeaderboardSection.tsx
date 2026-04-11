"use client";

import React, { useEffect, useState } from "react";
import { getCurrentWeek, getWeeklyLeaderboard, getCumulativeLeaderboard } from "@/app/actions/weekly";

interface WeeklyEntry {
  roll_number: string;
  score: number;
  percentage: number;
  completed_at: string;
}

interface CumulativeEntry {
  roll_number: string;
  total_score: number;
  weeks_completed: number;
  avg_percentage: number;
}

export default function LeaderboardSection() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<number | "total">("total");
  const [weeklyData, setWeeklyData] = useState<WeeklyEntry[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const res = await getCurrentWeek();
      setCurrentWeek(res.week);
      setSelectedWeek("total");
      await loadCumulative();
    };
    init();
  }, []);

  const loadWeek = async (week: number) => {
    setLoading(true);
    const res = await getWeeklyLeaderboard(week);
    if (res.success && res.data) {
      setWeeklyData(res.data);
    } else {
      setWeeklyData([]);
    }
    setLoading(false);
  };

  const loadCumulative = async () => {
    setLoading(true);
    const res = await getCumulativeLeaderboard();
    if (res.success && res.data) {
      setCumulativeData(res.data);
    } else {
      setCumulativeData([]);
    }
    setLoading(false);
  };

  const handleFilter = (filter: number | "total") => {
    setSelectedWeek(filter);
    if (filter === "total") {
      loadCumulative();
    } else {
      loadWeek(filter);
    }
  };

  const getRankDisplay = (idx: number) => {
    if (idx === 0) return "🥇";
    if (idx === 1) return "🥈";
    if (idx === 2) return "🥉";
    return `#${idx + 1}`;
  };

  const getRankColor = (idx: number) => {
    if (idx === 0) return "bg-yellow-100 text-yellow-900 border-yellow-300";
    if (idx === 1) return "bg-gray-100 text-gray-900 border-gray-300";
    if (idx === 2) return "bg-orange-100 text-orange-900 border-orange-300";
    return "bg-gray-50 text-gray-900 border-gray-200";
  };

  const weekOptions = Array.from({ length: currentWeek }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-gray-900">🏆 Leaderboard</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleFilter("total")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedWeek === "total"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Total
          </button>
          {weekOptions.map((w) => (
            <button
              key={w}
              onClick={() => handleFilter(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedWeek === w
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              W{w}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading leaderboard...</p>
        </div>
      ) : selectedWeek === "total" ? (
        cumulativeData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weeks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cumulativeData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getRankColor(idx)}`}>
                        {getRankDisplay(idx)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-900 font-semibold text-sm">{entry.roll_number}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                        {entry.total_score}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-sm">{entry.weeks_completed}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        entry.avg_percentage >= 70 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {entry.avg_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🏆</span>
            </div>
            <p className="text-gray-500 text-sm">No scores recorded yet. Take a test to appear on the leaderboard!</p>
          </div>
        )
      ) : (
        weeklyData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeklyData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getRankColor(idx)}`}>
                        {getRankDisplay(idx)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-900 font-semibold text-sm">{entry.roll_number}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs">
                        {entry.score}/10
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
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📊</span>
            </div>
            <p className="text-gray-500 text-sm">
              {selectedWeek === currentWeek
                ? "No scores yet for this week. Be the first to take the test!"
                : `No results for Week ${selectedWeek}.`}
            </p>
          </div>
        )
      )}
    </div>
  );
}
