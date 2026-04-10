"use client";

import Link from "next/link";
import { useState } from "react";

export default function AuthHome() {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome</h1>
        <p className="text-gray-600">Choose an option to get started</p>
      </div>

      <div className="space-y-4">
        <Link href="/register">
          <button
            onMouseEnter={() => setIsHovered("register")}
            onMouseLeave={() => setIsHovered(null)}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              isHovered === "register"
                ? "bg-blue-600 text-white shadow-lg transform scale-105"
                : "bg-white text-blue-600 border border-blue-600 shadow-md"
            }`}
          >
            Create New Account
          </button>
        </Link>

        <Link href="/login">
          <button
            onMouseEnter={() => setIsHovered("login")}
            onMouseLeave={() => setIsHovered(null)}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              isHovered === "login"
                ? "bg-indigo-600 text-white shadow-lg transform scale-105"
                : "bg-white text-indigo-600 border border-indigo-600 shadow-md"
            }`}
          >
            Login
          </button>
        </Link>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Choose Register to create a new account or Login to access your account</p>
      </div>
    </div>
  );
}
