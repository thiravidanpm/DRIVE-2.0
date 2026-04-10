import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">DRIVE 2.0</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-6 py-2 text-gray-700 font-medium hover:text-gray-900">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
                Register
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Assessment & Evaluation Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive testing and coding problem platform for skill assessment
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tests</h3>
            <p className="text-gray-600 text-sm">
              Multi-level assessments with beginner, intermediate, and advanced levels
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Coding Problems</h3>
            <p className="text-gray-600 text-sm">
              Practice programming challenges across different topics and complexity
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Leaderboard</h3>
            <p className="text-gray-600 text-sm">
              Track rankings and compare performance with other students in real-time
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              Detailed performance tracking with score history and progress insights
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link href="/register">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              Get Started
            </button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
              Sign In
            </button>
          </Link>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Register</h3>
              <p className="text-gray-600">Create your account with roll number and password</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select Level</h3>
              <p className="text-gray-600">Choose from three difficulty levels</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Take Test</h3>
              <p className="text-gray-600">Answer questions and submit your responses</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">View Results</h3>
              <p className="text-gray-600">Check scores and track your progress</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
            <p className="text-gray-900 font-semibold">Difficulty Levels</p>
            <p className="text-gray-600 text-sm mt-2">Beginner, Intermediate, Advanced</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">100+</div>
            <p className="text-gray-900 font-semibold">Test Questions</p>
            <p className="text-gray-600 text-sm mt-2">Comprehensive question bank</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">Live</div>
            <p className="text-gray-900 font-semibold">Leaderboard</p>
            <p className="text-gray-600 text-sm mt-2">Real-time rankings</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gray-900 rounded-lg p-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Start Your Assessment Journey</h2>
          <p className="text-gray-300 mb-8">Join and test your knowledge today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                Register Now
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold border border-gray-600 hover:bg-gray-700 transition">
                Already Have Account
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2026 DRIVE 2.0. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
