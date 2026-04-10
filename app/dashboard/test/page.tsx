"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TestGateway from "@/app/components/TestGateway";

export default function TestPage() {
  const [rollNumber, setRollNumber] = useState<string>("");

  useEffect(() => {
    const storedRollNumber = localStorage.getItem("rollNumber");
    if (!storedRollNumber) {
      window.location.href = "/login";
      return;
    }
    setRollNumber(storedRollNumber);
  }, []);

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
        <TestGateway />
      </main>
    </div>
  );
}
