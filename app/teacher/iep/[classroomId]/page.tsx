"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function IEPPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [ieps, setIeps] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [form, setForm] = useState({
    strengths: "",
    areasOfConcern: "",
    learningGoals: "",
    interventions: "",
    reviewDate: "",
  });
  const [stats, setStats] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingIep, setEditingIep] = useState<any>(null);

  useEffect(() => {
    fetchStudents();
    fetchIeps();
  }, []);

  const fetchStudents = async () => {
    const res = await fetch(`/api/analytics?classroomId=${classroomId}`);
    const data = await res.json();
    setStudents(data.studentStats || []);
  };

  const fetchIeps = async () => {
    const res = await fetch(`/api/iep?classroomId=${classroomId}`);
    const data = await res.json();
    setIeps(data);
  };

  const generateDraft = async (studentId: string) => {
    setGenerating(true);
    setError("");
    const res = await fetch(`/api/iep/generate?studentId=${studentId}&classroomId=${classroomId}`);
    const data = await res.json();
    setForm({
      strengths: data.strengths,
      areasOfConcern: data.areasOfConcern,
      learningGoals: data.learningGoals,
      interventions: data.interventions,
      reviewDate: data.reviewDate,
    });
    setStats(data.stats);
    setGenerating(false);
  };

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setEditingIep(null);
    setMessage("");
    setStats(null);
    const existing = ieps.find((i) => i.studentId === student.student.id);
    if (existing) {
      setEditingIep(existing);
      setForm({
        strengths: existing.strengths || "",
        areasOfConcern: existing.areasOfConcern || "",
        learningGoals: existing.learningGoals || "",
        interventions: existing.interventions || "",
        reviewDate: existing.reviewDate ? existing.reviewDate.split("T")[0] : "",
      });
    } else {
      setForm({ strengths: "", areasOfConcern: "", learningGoals: "", interventions: "", reviewDate: "" });
      await generateDraft(student.student.id);
    }
  };

  const handleSave = async (status: string) => {
    if (editingIep) {
      const res = await fetch(`/api/iep/${editingIep.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });
      if (res.ok) {
        setMessage(`IEP ${status === "FINAL" ? "finalized" : "saved as draft"} successfully!`);
        fetchIeps();
      }
    } else {
      const res = await fetch("/api/iep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, studentId: selectedStudent.student.id, classroomId, status }),
      });
      if (res.ok) {
        setMessage(`IEP ${status === "FINAL" ? "finalized" : "saved as draft"} successfully!`);
        fetchIeps();
        const data = await res.json();
        setEditingIep(data);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Individualized Education Programs</h1>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Student List */}
          <div className="col-span-1">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-4">Students</h2>
              <div className="space-y-2">
                {students.map((s) => {
                  const hasIep = ieps.find((i) => i.studentId === s.student.id);
                  return (
                    <div
                      key={s.student.id}
                      onClick={() => handleSelectStudent(s)}
                      className={`p-3 rounded cursor-pointer border transition ${
                        selectedStudent?.student.id === s.student.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">{s.student.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          hasIep?.status === "FINAL" ? "bg-green-100 text-green-600" :
                          hasIep ? "bg-yellow-100 text-yellow-600" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {hasIep?.status === "FINAL" ? "Final" : hasIep ? "Draft" : "No IEP"}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-2 text-xs text-gray-400">
                        <span>📚 {s.completedLessons}/{s.totalLessons}</span>
                        <span>📝 {s.avgScore !== null ? `${s.avgScore}%` : "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* IEP Form */}
          <div className="col-span-2">
            {!selectedStudent ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select a student to view or create their IEP</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedStudent.student.name}</h2>
                    <p className="text-sm text-gray-400">{selectedStudent.student.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateDraft(selectedStudent.student.id)}
                      disabled={generating}
                      className="border border-blue-600 text-blue-600 px-3 py-1.5 rounded text-sm hover:bg-blue-50 disabled:opacity-50"
                    >
                      {generating ? "Generating..." : "🔄 Regenerate Draft"}
                    </button>
                    <button
                      onClick={() => router.push(`/teacher/iep/export/${editingIep?.id}`)}
                      disabled={!editingIep}
                      className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      📄 Export PDF
                    </button>
                  </div>
                </div>

                {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

                {/* Stats Summary */}
                {stats && (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-blue-50 rounded p-3 text-center">
                      <p className="text-xl font-bold text-blue-600">{stats.lessonCompletionRate}%</p>
                      <p className="text-xs text-gray-500">Lessons Done</p>
                    </div>
                    <div className="bg-green-50 rounded p-3 text-center">
                      <p className="text-xl font-bold text-green-600">{stats.avgScore !== null ? `${stats.avgScore}%` : "—"}</p>
                      <p className="text-xs text-gray-500">Avg Score</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-3 text-center">
                      <p className="text-xl font-bold text-yellow-600">{stats.tooFastCount}</p>
                      <p className="text-xs text-gray-500">Too Fast</p>
                    </div>
                    <div className="bg-red-50 rounded p-3 text-center">
                      <p className="text-xl font-bold text-red-600">{stats.lostCount}</p>
                      <p className="text-xs text-gray-500">Lost</p>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {[
                    { label: "Strengths", key: "strengths", placeholder: "Student's learning strengths..." },
                    { label: "Areas of Concern", key: "areasOfConcern", placeholder: "Areas needing improvement..." },
                    { label: "Learning Goals", key: "learningGoals", placeholder: "Specific, measurable goals..." },
                    { label: "Interventions", key: "interventions", placeholder: "Strategies and support measures..." },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <textarea
                        placeholder={placeholder}
                        className="w-full border rounded p-2 text-sm h-24 resize-none"
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
                    <input
                      type="date"
                      className="border rounded p-2 text-sm"
                      value={form.reviewDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, reviewDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave("DRAFT")}
                    className="border border-gray-300 text-gray-600 px-6 py-2 rounded text-sm hover:bg-gray-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSave("FINAL")}
                    className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Finalize IEP
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