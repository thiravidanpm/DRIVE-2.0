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
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleFilter("total")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
              selectedWeek === "total"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Total
          </button>
          {weekOptions.map((w) => (
            <button
              key={w}
              onClick={() => handleFilter(w)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                selectedWeek === w
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Week {w}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      ) : selectedWeek === "total" ? (
        /* ========= CUMULATIVE TOTAL VIEW ========= */
        cumulativeData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Roll Number</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Total Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Weeks</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Avg %</th>
                </tr>
              </thead>
              <tbody>
                {cumulativeData.map((entry, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-purple-50`}
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm border ${getRankColor(idx)}`}>
                        {getRankDisplay(idx)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">{entry.roll_number}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-purple-100 text-purple-900 px-4 py-2 rounded-lg font-bold text-lg">
                        {entry.total_score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 font-medium">{entry.weeks_completed}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                        entry.avg_percentage >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
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
          <div className="text-center py-12">
            <p className="text-gray-600">No scores recorded yet. Take a test to appear on the leaderboard!</p>
          </div>
        )
      ) : (
        /* ========= SINGLE WEEK VIEW ========= */
        weeklyData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Roll Number</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Percentage</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((entry, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm border ${getRankColor(idx)}`}>
                        {getRankDisplay(idx)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">{entry.roll_number}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-bold text-sm">
                        {entry.score}/10
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                        entry.percentage >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {entry.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(entry.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
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
