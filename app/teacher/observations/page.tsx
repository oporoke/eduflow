"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RATING_LABELS: { [key: number]: string } = {
  1: "Unsatisfactory",
  2: "Needs Improvement",
  3: "Satisfactory",
  4: "Good",
  5: "Excellent",
};

const ratingColors: { [key: number]: string } = {
  1: "bg-red-100 text-red-600",
  2: "bg-orange-100 text-orange-600",
  3: "bg-yellow-100 text-yellow-600",
  4: "bg-blue-100 text-blue-600",
  5: "bg-green-100 text-green-600",
};

export default function TeacherObservationsPage() {
  const router = useRouter();
  const [observations, setObservations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    const res = await fetch("/api/observations");
    const data = await res.json();
    setObservations(data);
  };

  const avgRating = (ratings: any[]) =>
    ratings?.length
      ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Observations</h1>
            <p className="text-gray-500 text-sm">View feedback from lesson observations</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {observations.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">👁️</p>
            <p>No observations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {observations.map((obs) => (
              <div key={obs.id} className="bg-white rounded shadow p-6">
                <div
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setSelected(selected?.id === obs.id ? null : obs)}
                >
                  <div>
                    <h3 className="font-semibold">{obs.topic}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Observer: {obs.observer?.name} · {new Date(obs.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {avgRating(obs.ratings) && (
                      <span className="text-lg font-bold text-blue-600">
                        {avgRating(obs.ratings)}/5
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      obs.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {obs.status}
                    </span>
                    <span className="text-gray-400">{selected?.id === obs.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {selected?.id === obs.id && obs.status === "COMPLETED" && (
                  <div className="mt-4 border-t pt-4">
                    {/* Ratings */}
                    {obs.ratings?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-3">Performance Ratings</h4>
                        <div className="space-y-2">
                          {obs.ratings.map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">{r.criteria}</p>
                              <span className={`text-xs px-2 py-1 rounded ${ratingColors[r.rating]}`}>
                                {r.rating}/5 — {RATING_LABELS[r.rating]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {obs.comments?.length > 0 && (
                      <div className="space-y-3">
                        {obs.comments.map((c: any) => (
                          <div key={c.id} className={`rounded p-3 ${
                            c.type === "strengths" ? "bg-green-50" :
                            c.type === "improvements" ? "bg-yellow-50" : "bg-blue-50"
                          }`}>
                            <p className="text-xs font-semibold text-gray-600 mb-1 capitalize">
                              {c.type === "strengths" ? "✅ Strengths" :
                               c.type === "improvements" ? "⚠️ Areas for Improvement" :
                               "💡 Recommendations"}
                            </p>
                            <p className="text-sm text-gray-700">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}