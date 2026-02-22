"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function StudentLiveView({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session?.subtopicId) fetchLessons(session.subtopicId);
  }, [session?.subtopicId]);

  const fetchSession = async () => {
    const res = await fetch(`/api/live-session?classroomId=${classroomId}`);
    const data = await res.json();
    setSession(data);
  };

  const fetchLessons = async (subtopicId: string) => {
    const res = await fetch(`/api/lessons?subtopicId=${subtopicId}`);
    const data = await res.json();
    setLessons(data);
  };

  const sendReaction = async (emoji: string) => {
    await fetch("/api/live-session/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, type: "reaction", emoji }),
    });
  };

  const sendPace = async (vote: string) => {
    await fetch("/api/live-session/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, type: "pace", vote }),
    });
    setMessage("Pace feedback sent!");
    setTimeout(() => setMessage(""), 2000);
  };

  const sendQuestion = async () => {
    if (!question.trim()) return;
    await fetch("/api/live-session/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, type: "question", question }),
    });
    setQuestion("");
    setMessage("Question submitted!");
    setTimeout(() => setMessage(""), 2000);
  };

  const currentLesson = lessons[session?.currentLessonIndex ?? 0];

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-white mb-2">Waiting for class to start...</h1>
          <p className="text-gray-400">Your teacher hasn't started a session yet</p>
          <button onClick={() => router.push("/classes")} className="mt-6 text-blue-400 hover:underline text-sm">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-white font-semibold">Live Session</span>
        </div>
        <span className="text-gray-400 text-sm">
          Slide {(session.currentLessonIndex ?? 0) + 1} of {lessons.length}
        </span>
      </div>

      {/* Main Content */}
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
          <p className="text-gray-400">Waiting for teacher...</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800 px-6 py-2">
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: lessons.length ? `${((session.currentLessonIndex + 1) / lessons.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Student Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        {message && <p className="text-green-400 text-sm mb-3 text-center">{message}</p>}

        <div className="flex flex-wrap gap-6 justify-center">
          {/* Reactions */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">React:</span>
            {["👍", "🤔", "❓", "🔥", "👏"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Pace */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Pace:</span>
            {["Too Fast", "Just Right", "Lost"].map((vote) => (
              <button
                key={vote}
                onClick={() => sendPace(vote)}
                className={`px-3 py-1 rounded text-xs text-white ${
                  vote === "Just Right" ? "bg-green-600 hover:bg-green-700" :
                  vote === "Too Fast" ? "bg-yellow-600 hover:bg-yellow-700" :
                  "bg-red-600 hover:bg-red-700"
                }`}
              >
                {vote}
              </button>
            ))}
          </div>

          {/* Question */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-1 text-sm w-48"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
            />
            <button
              onClick={sendQuestion}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}