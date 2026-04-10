"use client";

import React, { useEffect, useState } from "react";
import { getLeaderboard } from "@/app/actions/dashboard";

interface LeaderboardEntry {
  users: { roll_number: string };
  score: number;
  level: number;
  created_at: string;
}

export default function LeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const res = await getLeaderboard(20);
      if (res.success && res.data) {
        // Filter and typecast data to ensure correct structure
        const typedData = res.data.filter(entry => entry && entry.users) as unknown as LeaderboardEntry[];
        setLeaderboard(typedData);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getMedalText = (position: number) => {
    if (position === 0) return "1st";
    if (position === 1) return "2nd";
    if (position === 2) return "3rd";
    return `${position + 1}th`;
  };

  const getRankColor = (position: number) => {
    if (position === 0) return "bg-yellow-100 text-yellow-900 border-yellow-300";
    if (position === 1) return "bg-gray-100 text-gray-900 border-gray-300";
    if (position === 2) return "bg-orange-100 text-orange-900 border-orange-300";
    return "bg-gray-50 text-gray-900 border-gray-200";
  };

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Leaderboard</h2>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Rank</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Roll Number</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Level</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Score</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-200 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm border ${getRankColor(idx)}`}>
                      {getMedalText(idx)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">
                    {entry.users?.roll_number || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">Level {entry.level}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-bold text-sm">
                      {entry.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No scores yet. Be the first to take a test!</p>
        </div>
      )}
    </div>
  );
}
