"use client";

import { registerUser, setPassword } from "@/app/actions/auth";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [step, setStep] = useState<"rollNumber" | "password">("rollNumber");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await registerUser(rollNumber);

      if (result.success) {
        setMessage("Roll number registered! Now please set a password.");
        setStep("password");
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await setPassword(rollNumber, password);

      if (result.success) {
        setMessage("Password set successfully! You can now login.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex-col justify-center items-start p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 bg-green-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 space-y-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">D</div>
              <span className="text-xl font-bold text-white tracking-tight">DRIVE 2.0</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">Join the Platform</h1>
            <p className="text-gray-400 text-lg">Start your assessment journey today</p>
          </div>

          <div className="space-y-6">
            {[
              { step: "1", title: "Register", desc: "Create account with your roll number", active: step === "rollNumber" },
              { step: "2", title: "Set Password", desc: "Create a secure password", active: step === "password" },
              { step: "3", title: "Start Testing", desc: "Take assessments and compete", active: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all ${
                  item.active 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                    : "bg-white/5 border border-white/10 text-gray-400"
                }`}>
                  {item.step}
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${item.active ? "text-white" : "text-gray-400"}`}>{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-20">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">D</div>
            <span className="text-lg font-bold text-gray-900">DRIVE 2.0</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm mb-8">
            {step === "rollNumber" 
              ? "Register with your roll number" 
              : "Create a secure password"}
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">✅</span>
              <span>{message}</span>
            </div>
          )}

          {step === "rollNumber" ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Roll Number
                </label>
                <input
                  id="rollNumber"
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., CS001"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition text-gray-900 placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex items-center gap-2">
                <span>👤</span>
                <span>Roll Number: <strong>{rollNumber}</strong></span>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition text-gray-900 placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting Password...
                  </span>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
