"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PresenterPage({ params }: { params: Promise<{ subtopicId: string }> }) {
  const { subtopicId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  const [paceVotes, setPaceVotes] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(fetchSessionState, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchLessons = async () => {
    const res = await fetch(`/api/lessons?subtopicId=${subtopicId}`);
    const data = await res.json();
    setLessons(data);

    // Get classroomId via subtopic
    const subRes = await fetch(`/api/subtopics/${subtopicId}`);
    const subData = await subRes.json();
    setClassroomId(subData.classroomId);
  };

  const fetchSessionState = async () => {
    if (!classroomId) return;
    const res = await fetch(`/api/live-session?classroomId=${classroomId}`);
    const data = await res.json();
    if (data) {
      setReactions(data.reactions || []);
      setPaceVotes(data.paceVotes || []);
      setQuestions(data.questions || []);
    }
  };

  const startSession = async () => {
    if (!classroomId) return;
    const res = await fetch("/api/live-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomId, subtopicId }),
    });
    const data = await res.json();
    setSessionId(data.id);
    setStarted(true);
  };

  const navigate = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= lessons.length) return;
    setCurrentIndex(newIndex);
    await fetch("/api/live-session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, currentLessonIndex: newIndex }),
    });
  };

  const endSession = async () => {
    await fetch("/api/live-session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, active: false }),
    });
    router.back();
  };

  const markAnswered = async (questionId: string) => {
    await fetch("/api/live-session/interact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const paceSummary = {
    "Too Fast": paceVotes.filter((v) => v.vote === "Too Fast").length,
    "Just Right": paceVotes.filter((v) => v.vote === "Just Right").length,
    "Lost": paceVotes.filter((v) => v.vote === "Lost").length,
  };

  const currentLesson = lessons[currentIndex];

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Ready to Present?</h1>
          <p className="text-gray-400 mb-8">{lessons.length} lessons in this subtopic</p>
          <button
            onClick={startSession}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700"
          >
            Start Presentation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Presentation Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">Presenter Mode</span>
            <span className="text-gray-400 text-sm">{currentIndex + 1} / {lessons.length}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-600 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => navigate(currentIndex + 1)}
              disabled={currentIndex === lessons.length - 1}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-40"
            >
              Next →
            </button>
            <button
              onClick={endSession}
              className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 flex items-center justify-center p-12">
          {currentLesson ? (
            <div className="max-w-3xl w-full">
              <h1 className="text-4xl font-bold text-white mb-8">{currentLesson.title}</h1>
              {currentLesson.text && (
                <p className="text-gray-300 text-xl leading-relaxed">{currentLesson.text}</p>
              )}
              {currentLesson.imageUrl && (
                <img src={currentLesson.imageUrl} alt={currentLesson.title} className="mt-6 rounded-lg max-h-96 object-cover w-full" />
              )}
              {currentLesson.videoUrl && (
                currentLesson.videoUrl.includes("youtube") ? (
                  <iframe className="mt-6 w-full h-72 rounded-lg" src={currentLesson.videoUrl} allowFullScreen />
                ) : (
                  <video src={currentLesson.videoUrl} controls className="mt-6 rounded-lg w-full max-h-72" />
                )
              )}
            </div>
          ) : (
            <p className="text-gray-400">No lessons available</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 px-6 py-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / lessons.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700">
        {/* Reactions */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold mb-3">Live Reactions</h3>
          <div className="flex flex-wrap gap-2 min-h-8">
            {reactions.slice(0, 10).map((r) => (
              <span key={r.id} className="text-2xl animate-bounce">{r.emoji}</span>
            ))}
            {reactions.length === 0 && <p className="text-gray-500 text-sm">No reactions yet</p>}
          </div>
        </div>

        {/* Pace Indicator */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold mb-3">Pace Indicator</h3>
          <div className="space-y-2">
            {Object.entries(paceSummary).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        label === "Just Right" ? "bg-green-500" :
                        label === "Too Fast" ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: paceVotes.length ? `${(count / paceVotes.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-white text-sm w-4">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3">
            Questions ({questions.length})
          </h3>
          {questions.length === 0 ? (
            <p className="text-gray-500 text-sm">No questions yet</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="bg-gray-700 rounded p-3">
                  <p className="text-white text-sm mb-1">{q.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">{q.student?.name}</span>
                    <button
                      onClick={() => markAnswered(q.id)}
                      className="text-green-400 text-xs hover:underline"
                    >
                      Mark Answered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}