"use client";

import Link from "next/link";

export default function TestGateway() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Start Assessment</h2>
        <p className="text-gray-500 text-sm">Choose your assessment type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* L1 - Aptitude */}
        <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-2xl">📝</span>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">L1</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aptitude Test</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Weekly MCQ assessment covering aptitude, reasoning, and analytical skills. AI-generated fresh questions.
            </p>
            <div className="flex items-center gap-6 mb-6 py-4 border-t border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">10</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">10</p>
                <p className="text-xs text-gray-500">Minutes</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">MCQ</p>
                <p className="text-xs text-gray-500">Format</p>
              </div>
            </div>
            <Link href="/dashboard/test/l1">
              <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/30">
                Start Aptitude Test
              </button>
            </Link>
          </div>
        </div>

        {/* L2 - Coding */}
        <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-50 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <span className="text-2xl">💻</span>
              </div>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">L2</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Coding Challenge</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Weekly DSA coding problems with a built-in editor. Write in Python, Java, or C — auto-validated against test cases.
            </p>
            <div className="flex items-center gap-6 mb-6 py-4 border-t border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-xs text-gray-500">Problems</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-gray-500">Languages</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">Code</p>
                <p className="text-xs text-gray-500">Format</p>
              </div>
            </div>
            <Link href="/dashboard/test/l2">
              <button className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-500 hover:to-green-600 transition-all shadow-lg shadow-green-600/20 group-hover:shadow-green-600/30">
                Start Coding Challenge
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Test Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Fullscreen mode is required during tests",
            "Exiting fullscreen or switching tabs counts as a violation",
            "3 violations will auto-submit your test",
            "Each test can only be taken once per week",
            "Scores are recorded on the leaderboard",
            "L1 is MCQ-based, L2 requires writing code",
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
