"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import CommentSection from "@/components/CommentSection";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";

export default function StudentLessonsPage({ params }: { params: Promise<{ subtopicId: string }> }) {
  const { subtopicId } = use(params);
  const router = useRouter();
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [lessonId: string]: boolean }>({});

  useEffect(() => {
    fetchLessons();
    fetchProgress();
  }, []);

  const fetchLessons = async () => {
    const res = await fetch(`/api/lessons?subtopicId=${subtopicId}`);
    const data = await res.json();
    setLessons(data);
  };

  const fetchProgress = async () => {
    const res = await fetch(`/api/lessons/progress?subtopicId=${subtopicId}`);
    const data = await res.json();
    const map: { [lessonId: string]: boolean } = {};
    data.forEach((p: any) => { map[p.lessonId] = p.completed; });
    setProgress(map);
  };

  const toggleComplete = async (lessonId: string) => {
    const completed = !progress[lessonId];
    await fetch("/api/lessons/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed }),
    });
    setProgress((prev) => ({ ...prev, [lessonId]: completed }));
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = lessons.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lessons</h1>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="bg-white rounded shadow p-4 mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedCount}/{totalCount} completed ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {lessons.length === 0 ? (
          <p className="text-gray-500">No lessons available yet.</p>
        ) : (
          <div className="space-y-6">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`bg-white rounded shadow p-6 border-l-4 ${
                  progress[lesson.id] ? "border-green-500" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!progress[lesson.id]}
                      onChange={() => toggleComplete(lesson.id)}
                      className="w-4 h-4 accent-green-500 cursor-pointer"
                    />
                    <h2 className={`text-lg font-semibold ${progress[lesson.id] ? "line-through text-gray-400" : ""}`}>
                      {lesson.title}
                    </h2>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {lesson.contentType}
                  </span>
                </div>

                {lesson.text && (
                  <p className="text-gray-700 text-sm leading-relaxed">{lesson.text}</p>
                )}

                {lesson.imageUrl && (
                  <img
                    src={lesson.imageUrl}
                    alt={lesson.title}
                    className="mt-3 rounded max-h-64 object-cover w-full"
                  />
                )}

                {lesson.videoUrl && (
                  lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be") ? (
                    <iframe
                      className="mt-3 w-full h-56 rounded"
                      src={lesson.videoUrl}
                      allowFullScreen
                    />
                  ) : (
                    <video src={lesson.videoUrl} controls className="mt-3 rounded w-full max-h-56" />
                  )
                )}
                    <Link
                href={`/student/tutor?subject=${encodeURIComponent(lesson?.subtopic?.topic?.subject?.name || "")}&topic=${encodeURIComponent(lesson?.subtopic?.topic?.name || "")}`}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                🤖 Ask EduBot
              </Link>
                {lesson.audioLesson && (
                  <AudioPlayer
                    audioUrl={lesson.audioLesson.audioUrl}
                    duration={lesson.audioLesson.duration}
                    chapters={lesson.audioLesson.chapters || []}
                    transcript={lesson.audioLesson.transcript}
                    language={lesson.audioLesson.language}
                  />
                )}
                <CommentSection lessonId={lesson.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
