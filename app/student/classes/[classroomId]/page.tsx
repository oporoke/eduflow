"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function StudentCurriculumPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [openTopics, setOpenTopics] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const res = await fetch(`/api/subjects?classroomId=${classroomId}`);
    const data = await res.json();
    setSubjects(data);
  };

  const toggleTopic = (topicId: string) => {
    setOpenTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Curriculum</h1>
          <button onClick={() => router.push("/classes")} className="text-sm text-blue-600 hover:underline">
            Back to Classes
          </button>
        </div>

        {subjects.length === 0 ? (
          <p className="text-gray-500">No curriculum available yet.</p>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold mb-4">📚 {subject.name}</h2>

                {subject.topics.length === 0 ? (
                  <p className="text-gray-400 text-sm">No topics yet.</p>
                ) : (
                  subject.topics.map((topic: any) => (
                    <div key={topic.id} className="mb-3 border-l-2 border-gray-200 pl-4">
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-blue-600"
                      >
                        <span>📖 {topic.name}</span>
                        <span>{openTopics[topic.id] ? "▲" : "▼"}</span>
                      </button>

                      {openTopics[topic.id] && (
                        <div className="mt-2 space-y-2 ml-4">
                          {topic.subtopics.length === 0 ? (
                            <p className="text-gray-400 text-sm">No subtopics yet.</p>
                          ) : (
                            topic.subtopics.map((subtopic: any) => (
                              <div
                                key={subtopic.id}
                                className="flex items-center justify-between text-sm text-gray-600 py-1"
                              >
                                <span>• {subtopic.name}</span>
                                <button
                                  onClick={() => router.push(`/student/lessons/${subtopic.id}`)}
                                  className="text-blue-600 hover:underline text-xs ml-4"
                                >
                                  View Lessons
                                </button>
                                <button
                                onClick={() => router.push(`/student/quizzes/${subtopic.id}`)}
                                className="text-green-600 hover:underline text-xs"
                              >
                                Take Quiz
                              </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
