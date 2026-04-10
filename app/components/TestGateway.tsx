"use client";

import Link from "next/link";

export default function TestGateway() {
  const levels = [
    {
      level: 1,
      title: "Beginner",
      description: "Test your basic knowledge",
      questions: 10,
      duration: "10 mins",
      color: "bg-blue-50",
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
    },
    {
      level: 2,
      title: "Intermediate",
      description: "Challenge your skills",
      questions: 15,
      duration: "15 mins",
      color: "bg-green-50",
      borderColor: "border-green-300",
      textColor: "text-green-700",
    },
    {
      level: 3,
      title: "Advanced",
      description: "Master your expertise",
      questions: 20,
      duration: "20 mins",
      color: "bg-purple-50",
      borderColor: "border-purple-300",
      textColor: "text-purple-700",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Assessment</h2>
      <p className="text-gray-600 mb-8">
        Choose a difficulty level to begin your assessment
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {levels.map((level) => (
          <div
            key={level.level}
            className={`${level.color} rounded-lg p-6 border-2 ${level.borderColor} transition-all hover:shadow-lg hover:border-opacity-100`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${level.textColor}`}>{level.title}</h3>
                <p className="text-gray-700 mt-1 text-sm">{level.description}</p>
              </div>
              <span className={`text-3xl font-bold ${level.textColor} ml-4`}>L{level.level}</span>
            </div>

            <div className="space-y-2 mb-6 py-4 border-t border-b border-current border-opacity-20">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Questions:</span>
                <span className={`font-bold ${level.textColor}`}>{level.questions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Duration:</span>
                <span className={`font-bold ${level.textColor}`}>{level.duration}</span>
              </div>
            </div>

            <Link href={`/dashboard/test/l${level.level}`}>
              <button
                className={`w-full py-2 px-4 font-bold rounded-lg transition bg-white border-2 ${level.borderColor} ${level.textColor} hover:bg-gray-50`}
              >
                Start Test
              </button>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Test Guidelines</h3>
        <ul className="text-gray-700 space-y-2 text-sm">
          <li>• Each level contains multiple choice questions</li>
          <li>• You have a limited time to complete each test</li>
          <li>• Your score will be recorded and displayed on the leaderboard</li>
          <li>• You can retake tests at any time to improve your score</li>
          <li>• Higher levels require completion of previous levels</li>
        </ul>
      </div>
    </div>
  );
}
