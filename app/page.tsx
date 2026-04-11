import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">D</div>
            <h1 className="text-xl font-bold tracking-tight">DRIVE 2.0</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <button className="px-5 py-2 text-sm text-gray-300 font-medium hover:text-white transition">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-20 animate-fadeIn">
          <div className="inline-block px-4 py-1.5 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-full border border-blue-500/20 mb-6">
            Weekly Assessment Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Assess. Code.
            <span className="text-gradient"> Excel.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Two-level assessment platform — aptitude tests and coding challenges. 
            Compete weekly, climb the leaderboard, and sharpen your skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition shadow-xl shadow-blue-600/25 text-sm">
                Create Account
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-3.5 bg-white/5 text-white border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition text-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
          <div className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">L1 — Aptitude Tests</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              10-question weekly MCQ assessments covering aptitude, reasoning, and analytical skills. AI-generated fresh questions every week.
            </p>
          </div>

          <div className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center text-lg mb-4">💻</div>
            <h3 className="text-lg font-semibold mb-2">L2 — Coding Challenges</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              4 DSA coding problems per week with a built-in code editor. Write in Python, Java, or C — auto-validated against test cases.
            </p>
          </div>

          <div className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg mb-4">🏆</div>
            <h3 className="text-lg font-semibold mb-2">Live Leaderboard</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time rankings with cumulative scoring. Track your weekly performance and total points across all assessments.
            </p>
          </div>

          <div className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-lg mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Detailed analytics with weekly breakdowns, best scores, and cumulative performance insights on your personal dashboard.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Register", desc: "Create your account with roll number" },
              { step: "2", title: "Choose Level", desc: "L1 Aptitude or L2 Coding" },
              { step: "3", title: "Take Test", desc: "Complete weekly assessments" },
              { step: "4", title: "Compete", desc: "Climb the leaderboard" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">2</div>
            <p className="font-medium text-sm">Assessment Levels</p>
            <p className="text-gray-500 text-xs mt-1">Aptitude + Coding</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">Weekly</div>
            <p className="font-medium text-sm">Fresh Challenges</p>
            <p className="text-gray-500 text-xs mt-1">New questions every week</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">Live</div>
            <p className="font-medium text-sm">Leaderboard</p>
            <p className="text-gray-500 text-xs mt-1">Real-time rankings</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-12 text-center mb-8">
          <h2 className="text-2xl font-bold mb-3">Ready to Begin?</h2>
          <p className="text-gray-400 mb-8 text-sm">Join the assessment platform and start competing today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-600/25 text-sm">
                Register Now
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition text-sm">
                Already Have Account
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; 2026 DRIVE 2.0 &mdash; Assessment &amp; Evaluation Platform
        </div>
      </footer>
    </div>
  );
}
