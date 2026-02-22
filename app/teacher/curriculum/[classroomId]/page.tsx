"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function CurriculumPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState<{ [key: string]: string }>({});
  const [newSubtopic, setNewSubtopic] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const res = await fetch(`/api/subjects?classroomId=${classroomId}`);
    const data = await res.json();
    setSubjects(data);
  };

  const addSubject = async () => {
    if (!newSubject) return;
    await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubject, classroomId }),
    });
    setNewSubject("");
    setMessage("Subject added");
    fetchSubjects();
  };

  const addTopic = async (subjectId: string) => {
  if (!newTopic[subjectId]) {
    alert("Please enter a topic name first");
    return;
  }
  const res = await fetch("/api/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newTopic[subjectId], subjectId }),
  });
  const data = await res.json();
  console.log("Topic response:", data);
  setNewTopic((prev) => ({ ...prev, [subjectId]: "" }));
  setMessage("Topic added");
  fetchSubjects();
};

  const addSubtopic = async (topicId: string) => {
    if (!newSubtopic[topicId]) return;
    await fetch("/api/subtopics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubtopic[topicId], topicId }),
    });
    setNewSubtopic((prev) => ({ ...prev, [topicId]: "" }));
    setMessage("Subtopic added");
    fetchSubjects();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Curriculum</h1>
          <button onClick={() => router.push("/classes")} className="text-sm text-blue-600 hover:underline">
            Back to Classes
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Add Subject */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Subject</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Subject name"
              className="flex-1 border p-2 rounded"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button onClick={addSubject} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">
              Add
            </button>
          </div>
        </div>

        {/* Subjects List */}
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white rounded shadow p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4">📚 {subject.name}</h2>

            {/* Add Topic */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add topic"
                className="flex-1 border p-2 rounded text-sm"
                value={newTopic[subject.id] ?? ""}
                onChange={(e) => setNewTopic((prev) => ({ ...prev, [subject.id]: e.target.value }))}
              />
              <button onClick={() => addTopic(subject.id)} className="bg-green-600 text-white px-3 rounded text-sm hover:bg-green-700">
                Add Topic
              </button>
            </div>

            {/* Topics */}
            {subject.topics.map((topic: any) => (
              <div key={topic.id} className="ml-4 mb-4 border-l-2 border-gray-200 pl-4">
                <h3 className="font-medium mb-2">📖 {topic.name}</h3>

                {/* Add Subtopic */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add subtopic"
                    className="flex-1 border p-2 rounded text-sm"
                    value={newSubtopic[topic.id] ?? ""}
                    onChange={(e) => setNewSubtopic((prev) => ({ ...prev, [topic.id]: e.target.value }))}
                  />
                  <button onClick={() => addSubtopic(topic.id)} className="bg-purple-600 text-white px-3 rounded text-sm hover:bg-purple-700">
                    Add Subtopic
                  </button>
                </div>

                {/* Subtopics */}

                {/* Subtopics */}
                {/* Subtopics */}
                {topic.subtopics.map((subtopic: any) => (
                  <div key={subtopic.id} className="ml-4 flex items-center justify-between text-sm text-gray-600 py-1">
                    <span>• {subtopic.name}</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/teacher/lessons/${subtopic.id}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Manage Lessons
                      </button>
                      <button
                        onClick={() => router.push(`/teacher/quizzes/${subtopic.id}`)}
                        className="text-green-600 hover:underline text-xs"
                      >
                        Manage Quizzes
                      </button>
                      <button
                        onClick={() => router.push(`/teacher/present/${subtopic.id}`)}
                        className="text-orange-600 hover:underline text-xs font-semibold"
                      >
                        ▶ Present
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
