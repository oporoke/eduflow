"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPE_COLORS: { [key: string]: string } = {
  REVISIT: "bg-red-50 border-red-200 text-red-700",
  PRACTICE: "bg-yellow-50 border-yellow-200 text-yellow-700",
  ADVANCE: "bg-green-50 border-green-200 text-green-700",
  START: "bg-blue-50 border-blue-200 text-blue-700",
};

const TYPE_ICONS: { [key: string]: string } = {
  REVISIT: "🔄",
  PRACTICE: "💪",
  ADVANCE: "🚀",
  START: "▶️",
};

const TYPE_LABELS: { [key: string]: string } = {
  REVISIT: "Revisit",
  PRACTICE: "Practice",
  ADVANCE: "Advance",
  START: "Start",
};

export default function LearningPathPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [path, setPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPath();
  }, []);

  const fetchPath = async () => {
    setLoading(true);
    const res = await fetch(`/api/learning-path?classroomId=${classroomId}`);
    const data = await res.json();
    setPath(data);
    setLoading(false);
  };

  const markComplete = async (itemId: string) => {
    await fetch("/api/learning-path", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setMessage("Item marked as complete!");
    fetchPath();
  };

  const pending = path?.items?.filter((i: any) => !i.completed) || [];
  const completed = path?.items?.filter((i: any) => i.completed) || [];
  const progress = path?.items?.length
    ? Math.round((completed.length / path.items.length) * 100)
    : 0;

  const revisitCount = pending.filter((i: any) => i.type === "REVISIT").length;
  const practiceCount = pending.filter((i: any) => i.type === "PRACTICE").length;
  const advanceCount = pending.filter((i: any) => i.type === "ADVANCE").length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Learning Path</h1>
            <p className="text-gray-500 text-sm">Personalized recommendations based on your performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchPath}
              className="border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {loading ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3 animate-pulse">🧠</p>
            <p>Generating your personalized learning path...</p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="bg-white rounded shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Path Progress</h2>
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-red-50 rounded p-3">
                  <p className="text-xl font-bold text-red-600">{revisitCount}</p>
                  <p className="text-xs text-gray-500">🔄 To Revisit</p>
                </div>
                <div className="bg-yellow-50 rounded p-3">
                  <p className="text-xl font-bold text-yellow-600">{practiceCount}</p>
                  <p className="text-xs text-gray-500">💪 To Practice</p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-xl font-bold text-green-600">{advanceCount}</p>
                  <p className="text-xs text-gray-500">🚀 To Advance</p>
                </div>
              </div>
            </div>

            {/* Pending Items */}
            {pending.length === 0 ? (
              <div className="bg-white rounded shadow p-8 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="font-semibold text-green-600">Your learning path is complete!</p>
                <p className="text-gray-500 text-sm mt-1">
                  Take more quizzes to get new recommendations
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <h2 className="font-semibold text-sm text-gray-600">
                  Up Next ({pending.length} items)
                </h2>
                {pending.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className={`rounded shadow p-5 border ${TYPE_COLORS[item.type]}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{TYPE_ICONS[item.type]}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                              {TYPE_LABELS[item.type]}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-white bg-opacity-60 px-2 py-0.5 rounded-full font-medium">
                                Next up
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm opacity-80 mt-1">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end ml-4">
                        {item.lessonId && (
                          <Link
                            href={`/student/lessons/${item.subtopicId}`}
                            className="text-xs bg-white bg-opacity-70 px-3 py-1.5 rounded hover:bg-opacity-100 transition font-medium"
                          >
                            Go to Lesson →
                          </Link>
                        )}
                        {item.quizId && (
                          <Link
                            href={`/student/quiz/${item.quizId}`}
                            className="text-xs bg-white bg-opacity-70 px-3 py-1.5 rounded hover:bg-opacity-100 transition font-medium"
                          >
                            Take Quiz →
                          </Link>
                        )}
                        {item.subtopicId && !item.lessonId && !item.quizId && (
                          <Link
                            href={`/student/lessons/${item.subtopicId}`}
                            className="text-xs bg-white bg-opacity-70 px-3 py-1.5 rounded hover:bg-opacity-100 transition font-medium"
                          >
                            Start →
                          </Link>
                        )}
                        <button
                          onClick={() => markComplete(item.id)}
                          className="text-xs opacity-60 hover:opacity-100 underline"
                        >
                          Mark done
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Items */}
            {completed.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm text-gray-600 mb-3">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-2">
                  {completed.map((item: any) => (
                    <div key={item.id} className="bg-white rounded shadow p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <span className="text-green-500">✅</span>
                        <div>
                          <p className="font-medium text-sm line-through">{item.title}</p>
                          <p className="text-xs text-gray-400">
                            Completed {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}