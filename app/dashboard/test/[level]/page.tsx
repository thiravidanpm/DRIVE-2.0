"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TestComponent from "@/app/components/TestComponent";

export default function TestLevelPage({
  params,
}: {
  params: { level: string };
}) {
  const [userId, setUserId] = useState<number | null>(null);
  const [rollNumber, setRollNumber] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const level = parseInt(params.level);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading test...</p>
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
          <Link href="/dashboard">
            <h1 className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition">
              Dashboard
            </h1>
          </Link>
          <div className="text-gray-600">{rollNumber}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <TestComponent level={level} userId={userId} />
      </main>
    </div>
  );
}
