"use client";

import React, { useEffect, useState } from "react";
import { getCurrentWeek, getWeeklyLeaderboard, getCumulativeLeaderboard } from "@/app/actions/weekly";
import { getL2CurrentWeek, getL2WeeklyLeaderboard, getL2CumulativeLeaderboard } from "@/app/actions/l2";

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

interface L2WeeklyEntry {
  roll_number: string;
  problems_solved: number;
  total_problems: number;
  score: number;
}

interface L2CumulativeEntry {
  roll_number: string;
  total_score: number;
  total_solved: number;
  weeks_completed: number;
}

interface CombinedEntry {
  roll_number: string;
  l1_score: number;
  l2_score: number;
  combined_score: number;
}

type Level = "L1" | "L2" | "Both";

export default function LeaderboardSection() {
  const [level, setLevel] = useState<Level>("L1");
  const [l1Week, setL1Week] = useState(1);
  const [l2Week, setL2Week] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<number | "total">("total");
  const [weeklyData, setWeeklyData] = useState<WeeklyEntry[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeEntry[]>([]);
  const [l2WeeklyData, setL2WeeklyData] = useState<L2WeeklyEntry[]>([]);
  const [l2CumulativeData, setL2CumulativeData] = useState<L2CumulativeEntry[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [r1, r2] = await Promise.all([getCurrentWeek(), getL2CurrentWeek()]);
      setL1Week(r1.week);
      setL2Week(r2.week);
      setSelectedWeek("total");
      await loadL1Cumulative();
    };
    init();
  }, []);

  // L1 loaders
  const loadL1Week = async (week: number) => {
    setLoading(true);
    const res = await getWeeklyLeaderboard(week);
    setWeeklyData(res.success && res.data ? res.data : []);
    setLoading(false);
  };
  const loadL1Cumulative = async () => {
    setLoading(true);
    const res = await getCumulativeLeaderboard();
    setCumulativeData(res.success && res.data ? res.data : []);
    setLoading(false);
  };

  // L2 loaders
  const loadL2Week = async (week: number) => {
    setLoading(true);
    const res = await getL2WeeklyLeaderboard(week);
    setL2WeeklyData(res.success && res.data ? res.data : []);
    setLoading(false);
  };
  const loadL2Cumulative = async () => {
    setLoading(true);
    const res = await getL2CumulativeLeaderboard();
    setL2CumulativeData(res.success && res.data ? res.data : []);
    setLoading(false);
  };

  // Combined loader
  const loadCombined = async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([getCumulativeLeaderboard(), getL2CumulativeLeaderboard()]);
    const map = new Map<string, CombinedEntry>();
    if (r1.success && r1.data) {
      for (const e of r1.data) {
        map.set(e.roll_number, { roll_number: e.roll_number, l1_score: e.total_score, l2_score: 0, combined_score: e.total_score });
      }
    }
    if (r2.success && r2.data) {
      for (const e of r2.data) {
        const existing = map.get(e.roll_number);
        if (existing) {
          existing.l2_score = e.total_score;
          existing.combined_score = existing.l1_score + e.total_score;
        } else {
          map.set(e.roll_number, { roll_number: e.roll_number, l1_score: 0, l2_score: e.total_score, combined_score: e.total_score });
        }
      }
    }
    setCombinedData(Array.from(map.values()).sort((a, b) => b.combined_score - a.combined_score));
    setLoading(false);
  };

  const handleLevelChange = (lv: Level) => {
    setLevel(lv);
    setSelectedWeek("total");
    if (lv === "L1") loadL1Cumulative();
    else if (lv === "L2") loadL2Cumulative();
    else loadCombined();
  };

  const handleFilter = (filter: number | "total") => {
    setSelectedWeek(filter);
    if (level === "L1") {
      filter === "total" ? loadL1Cumulative() : loadL1Week(filter);
    } else if (level === "L2") {
      filter === "total" ? loadL2Cumulative() : loadL2Week(filter);
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

  const currentWeekCount = level === "L1" ? l1Week : l2Week;
  const weekOptions = Array.from({ length: currentWeekCount }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">🏆 Leaderboard</h2>
          {/* Level Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["L1", "L2", "Both"] as Level[]).map((lv) => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
                  level === lv
                    ? lv === "L1" ? "bg-blue-600 text-white shadow-sm"
                      : lv === "L2" ? "bg-green-600 text-white shadow-sm"
                      : "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {lv === "Both" ? "L1+L2" : lv}
              </button>
            ))}
          </div>
        </div>
        {/* Week filters — only for L1 and L2 (not Both) */}
        {level !== "Both" && (
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
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
                    ? level === "L1" ? "bg-blue-600 text-white shadow-sm" : "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                W{w}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading leaderboard...</p>
        </div>
      ) : level === "Both" ? (
        /* ========== COMBINED L1+L2 ========== */
        combinedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">L1 Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">L2 Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Combined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {combinedData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getRankColor(idx)}`}>
                        {getRankDisplay(idx)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-900 font-semibold text-sm">{entry.roll_number}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs">
                        {entry.l1_score}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold text-xs">
                        {entry.l2_score}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                        {entry.combined_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No scores recorded yet." />
        )
      ) : level === "L1" ? (
        /* ========== L1 ========== */
        selectedWeek === "total" ? (
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
            <EmptyState message="No L1 scores recorded yet. Take a test to appear on the leaderboard!" />
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
            <EmptyState message={selectedWeek === l1Week ? "No scores yet for this week." : `No L1 results for Week ${selectedWeek}.`} />
          )
        )
      ) : (
        /* ========== L2 ========== */
        selectedWeek === "total" ? (
          l2CumulativeData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Solved</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weeks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {l2CumulativeData.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getRankColor(idx)}`}>
                          {getRankDisplay(idx)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-900 font-semibold text-sm">{entry.roll_number}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                          {entry.total_score}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">{entry.total_solved}</td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">{entry.weeks_completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No L2 scores recorded yet. Solve coding problems to appear here!" />
          )
        ) : (
          l2WeeklyData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Solved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {l2WeeklyData.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getRankColor(idx)}`}>
                          {getRankDisplay(idx)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-900 font-semibold text-sm">{entry.roll_number}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold text-xs">
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">{entry.problems_solved}/{entry.total_problems}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message={selectedWeek === l2Week ? "No L2 scores yet for this week." : `No L2 results for Week ${selectedWeek}.`} />
          )
        )
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <span className="text-xl">🏆</span>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
