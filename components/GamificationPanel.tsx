"use client";

import { useEffect, useState } from "react";

export default function GamificationPanel() {
  const [data, setData] = useState<any>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch("/api/gamification");
    const d = await res.json();
    setData(d);
  };

  if (!data) return null;

  const unearnedBadges = data.allBadges.filter(
    (b: any) => !data.earnedBadges.find((e: any) => e.id === b.id)
  );

  return (
    <div className="bg-white rounded shadow p-6">
      {/* New Badge Alert */}
      {newBadges.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-yellow-700 font-semibold text-sm">🎉 New Badge Earned!</p>
          {newBadges.map((b) => (
            <p key={b} className="text-yellow-600 text-sm">{b}</p>
          ))}
        </div>
      )}

      {/* Points & Streak */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{data.points}</p>
          <p className="text-xs text-gray-500 mt-1">⚡ Total Points</p>
        </div>
        <div className="bg-orange-50 rounded p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{data.streak}</p>
          <p className="text-xs text-gray-500 mt-1">🔥 Day Streak</p>
        </div>
      </div>

      {/* Earned Badges */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm mb-3">
          Earned Badges ({data.earnedBadges.length}/{data.allBadges.length})
        </h3>
        {data.earnedBadges.length === 0 ? (
          <p className="text-gray-400 text-sm">No badges yet — complete lessons to earn your first!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.earnedBadges.map((b: any) => (
              <div
                key={b.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center w-20"
                title={b.description}
              >
                <p className="text-2xl">{b.icon}</p>
                <p className="text-xs text-gray-600 mt-1 leading-tight">{b.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Badges */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Locked Badges</h3>
        <div className="flex flex-wrap gap-2">
          {unearnedBadges.map((b: any) => (
            <div
              key={b.id}
              className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center w-20 opacity-50"
              title={b.description}
            >
              <p className="text-2xl grayscale">{b.icon}</p>
              <p className="text-xs text-gray-500 mt-1 leading-tight">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}