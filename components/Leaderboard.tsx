"use client";

import { useEffect, useState } from "react";

export default function Leaderboard({ classroomId }: { classroomId?: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const url = classroomId
      ? `/api/gamification/leaderboard?classroomId=${classroomId}`
      : "/api/gamification/leaderboard";
    const res = await fetch(url);
    const data = await res.json();
    setLeaderboard(data);
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="font-semibold mb-4">🏆 Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <p className="text-gray-400 text-sm">No points earned yet</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-3 rounded ${
                index === 0 ? "bg-yellow-50 border border-yellow-200" :
                index === 1 ? "bg-gray-50 border border-gray-200" :
                index === 2 ? "bg-orange-50 border border-orange-200" :
                "bg-white border border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8">
                  {index < 3 ? medals[index] : `${index + 1}.`}
                </span>
                <div>
                  <p className="font-medium text-sm">{entry.user?.name}</p>
                  <p className="text-xs text-gray-400">🔥 {entry.streak} day streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">{entry.points}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}