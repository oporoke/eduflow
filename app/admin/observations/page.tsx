"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const OBSERVATION_CRITERIA = [
  "Lesson Planning & Preparation",
  "Subject Knowledge",
  "Teaching Methods & Strategies",
  "Student Engagement",
  "Classroom Management",
  "Assessment & Feedback",
  "Use of Learning Materials",
  "Communication Skills",
];

const RATING_LABELS: { [key: number]: string } = {
  1: "Unsatisfactory",
  2: "Needs Improvement",
  3: "Satisfactory",
  4: "Good",
  5: "Excellent",
};

export default function ObservationsPage() {
  const router = useRouter();
  const [observations, setObservations] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ teacherId: "", classroomId: "", date: "", topic: "" });
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState({ strengths: "", improvements: "", recommendations: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [obsRes, teachersRes, classesRes] = await Promise.all([
      fetch("/api/observations"),
      fetch("/api/users?role=TEACHER"),
      fetch("/api/classes"),
    ]);
    const obsData = await obsRes.json();
    const teachersData = await teachersRes.json();
    const classesData = await classesRes.json();
    setObservations(obsData);
    setTeachers(teachersData);
    setClassrooms(classesData);
  };

  const scheduleObservation = async () => {
    if (!form.teacherId || !form.classroomId || !form.date || !form.topic) return;
    const res = await fetch("/api/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("Observation scheduled!");
      setShowForm(false);
      setForm({ teacherId: "", classroomId: "", date: "", topic: "" });
      fetchData();
    }
  };

  const saveObservation = async (status: string) => {
    const ratingsArray = Object.entries(ratings).map(([criteria, rating]) => ({ criteria, rating }));
    const commentsArray = [
      { type: "strengths", comment: comments.strengths },
      { type: "improvements", comment: comments.improvements },
      { type: "recommendations", comment: comments.recommendations },
    ].filter((c) => c.comment);

    await fetch("/api/observations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        observationId: selectedObservation.id,
        ratings: ratingsArray,
        comments: commentsArray,
        status,
      }),
    });

    setMessage(status === "COMPLETED" ? "Observation completed!" : "Draft saved!");
    fetchData();
    setSelectedObservation(null);
  };

  const openObservation = (obs: any) => {
    setSelectedObservation(obs);
    const ratingMap: { [key: string]: number } = {};
    obs.ratings?.forEach((r: any) => { ratingMap[r.criteria] = r.rating; });
    setRatings(ratingMap);
    const commentMap: { strengths: string; improvements: string; recommendations: string } = {
      strengths: "",
      improvements: "",
      recommendations: "",
    };
    obs.comments?.forEach((c: any) => {
      if (c.type in commentMap) commentMap[c.type as keyof typeof commentMap] = c.comment;
    });
    setComments(commentMap);
  };

  const avgRating = selectedObservation?.ratings?.length
    ? (selectedObservation.ratings.reduce((acc: number, r: any) => acc + r.rating, 0) /
        selectedObservation.ratings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Lesson Observations</h1>
            <p className="text-gray-500 text-sm">Schedule and conduct teacher performance observations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Schedule Observation
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Schedule Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Schedule Observation</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teacher</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.teacherId}
                  onChange={(e) => setForm((prev) => ({ ...prev, teacherId: e.target.value }))}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Classroom</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.classroomId}
                  onChange={(e) => setForm((prev) => ({ ...prev, classroomId: e.target.value }))}
                >
                  <option value="">Select classroom</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full border p-2 rounded text-sm"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Topic to be Observed</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis"
                  className="w-full border p-2 rounded text-sm"
                  value={form.topic}
                  onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                />
              </div>
            </div>
            <button
              onClick={scheduleObservation}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Schedule
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Observations List */}
          <div className="col-span-1 space-y-3">
            {observations.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">👁️</p>
                <p className="text-sm">No observations scheduled</p>
              </div>
            ) : (
              observations.map((obs) => (
                <div
                  key={obs.id}
                  onClick={() => openObservation(obs)}
                  className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                    selectedObservation?.id === obs.id ? "border-blue-500" :
                    obs.status === "COMPLETED" ? "border-green-500" :
                    "border-yellow-500"
                  }`}
                >
                  <p className="font-medium text-sm">{obs.teacher?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{obs.topic}</p>
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {new Date(obs.date).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      obs.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {obs.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Observation Form */}
          <div className="col-span-2">
            {!selectedObservation ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select an observation to fill in the evaluation form</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">{selectedObservation.teacher?.name}</h2>
                  <p className="text-sm text-gray-500">Topic: {selectedObservation.topic}</p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(selectedObservation.date).toLocaleDateString()}
                  </p>
                  {avgRating && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                      <span className="text-sm font-bold text-blue-600">{avgRating}/5</span>
                      <span className="text-xs text-gray-500">Average Rating</span>
                    </div>
                  )}
                </div>

                {/* Ratings */}
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3">Performance Ratings</h3>
                  <div className="space-y-3">
                    {OBSERVATION_CRITERIA.map((criteria) => (
                      <div key={criteria} className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 flex-1">{criteria}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => setRatings((prev) => ({ ...prev, [criteria]: score }))}
                              className={`w-8 h-8 rounded text-xs font-medium transition ${
                                ratings[criteria] === score
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              title={RATING_LABELS[score]}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      ✅ Strengths
                    </label>
                    <textarea
                      placeholder="What did the teacher do well?"
                      className="w-full border rounded p-2 text-sm h-20 resize-none"
                      value={comments.strengths}
                      onChange={(e) => setComments((prev) => ({ ...prev, strengths: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      ⚠️ Areas for Improvement
                    </label>
                    <textarea
                      placeholder="What could be improved?"
                      className="w-full border rounded p-2 text-sm h-20 resize-none"
                      value={comments.improvements}
                      onChange={(e) => setComments((prev) => ({ ...prev, improvements: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      💡 Recommendations
                    </label>
                    <textarea
                      placeholder="Specific recommendations for the teacher..."
                      className="w-full border rounded p-2 text-sm h-20 resize-none"
                      value={comments.recommendations}
                      onChange={(e) => setComments((prev) => ({ ...prev, recommendations: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => saveObservation("IN_PROGRESS")}
                    className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => saveObservation("COMPLETED")}
                    className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Complete Observation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}