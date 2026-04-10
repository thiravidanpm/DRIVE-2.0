"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUserScores, getUserProgress } from "@/app/actions/dashboard";

interface UserProgress {
  current_level: number;
  tests_completed: number;
}

interface UserScore {
  level: number;
  score: number;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}

export default function ProfileDashboard({
  userId,
  rollNumber,
}: {
  userId: number;
  rollNumber: string;
}) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [progressRes, scoresRes] = await Promise.all([
        getUserProgress(userId),
        getUserScores(userId),
      ]);

      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data);
      }
      if (scoresRes.success && scoresRes.data) {
        setScores(scoresRes.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const averageScore =
    scores.length > 0
      ? (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(2)
      : 0;

  const bestScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;

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
          <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm font-medium">Tests Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {loading ? "-" : progress?.tests_completed || 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
            <p className="text-gray-600 text-sm font-medium">Current Level</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {loading ? "-" : progress?.current_level || 1}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-600">
            <p className="text-gray-600 text-sm font-medium">Average Score</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {loading ? "-" : `${averageScore}%`}
            </p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Best Score</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{bestScore}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Attempts</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{scores.length}</p>
            </div>
          </div>
        </div>

        {/* Recent Scores */}
        {scores.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Test Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Level</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Correct/Total
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.slice(0, 5).map((score, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">Level {score.level}</td>
                      <td className="px-4 py-3 text-gray-900 font-bold">{score.score}%</td>
                      <td className="px-4 py-3 text-gray-600">
                        {score.correct_answers}/{score.total_questions}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(score.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {scores.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No test scores yet. Start with your first test!</p>
            <Link href="/dashboard/test">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                Take First Test
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
