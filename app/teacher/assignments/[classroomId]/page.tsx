"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function TeacherAssignmentsPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", totalMarks: 100 });
  const [message, setMessage] = useState("");
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({ marks: 0, feedback: "" });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    const res = await fetch(`/api/assignments?classroomId=${classroomId}`);
    const data = await res.json();
    setAssignments(data);
  };

  const fetchAssignment = async (id: string) => {
    const res = await fetch(`/api/assignments/${id}`);
    const data = await res.json();
    setSelectedAssignment(data);
  };

  const createAssignment = async () => {
    if (!form.title) return;
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classroomId }),
    });
    if (res.ok) {
      setMessage("Assignment created!");
      setShowForm(false);
      setForm({ title: "", description: "", dueDate: "", totalMarks: 100 });
      fetchAssignments();
    }
  };

  const gradeSubmission = async () => {
    const res = await fetch("/api/assignments/submit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: gradingSubmission.id, ...gradeForm }),
    });
    if (res.ok) {
      setMessage("Submission graded!");
      setGradingSubmission(null);
      fetchAssignment(selectedAssignment.id);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    setSelectedAssignment(null);
    fetchAssignments();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assignments</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Assignment
            </button>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Assignment</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Assignment title"
                className="w-full border p-2 rounded text-sm"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Description and instructions..."
                className="w-full border p-2 rounded text-sm h-24 resize-none"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                  <input
                    type="datetime-local"
                    className="w-full border p-2 rounded text-sm"
                    value={form.dueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Total Marks</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded text-sm"
                    value={form.totalMarks}
                    onChange={(e) => setForm((prev) => ({ ...prev, totalMarks: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <button
                onClick={createAssignment}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Create Assignment
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="col-span-1 space-y-3">
            {assignments.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm">No assignments yet</p>
              </div>
            ) : (
              assignments.map((a) => (
                <div
                  key={a.id}
                  onClick={() => fetchAssignment(a.id)}
                  className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                    selectedAssignment?.id === a.id ? "border-blue-500" : "border-transparent"
                  }`}
                >
                  <h3 className="font-medium text-sm">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.submissions?.length} submissions · {a.totalMarks} marks
                  </p>
                  {a.dueDate && (
                    <p className={`text-xs mt-1 ${
                      new Date(a.dueDate) < new Date() ? "text-red-500" : "text-gray-400"
                    }`}>
                      Due: {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Submissions Panel */}
          <div className="col-span-2">
            {!selectedAssignment ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select an assignment to view submissions</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedAssignment.title}</h2>
                    {selectedAssignment.description && (
                      <p className="text-sm text-gray-500 mt-1">{selectedAssignment.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>{selectedAssignment.totalMarks} marks</span>
                      {selectedAssignment.dueDate && (
                        <span>Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAssignment(selectedAssignment.id)}
                    className="text-red-400 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </div>

                <h3 className="font-semibold text-sm mb-3">
                  Submissions ({selectedAssignment.submissions?.length})
                </h3>

                {selectedAssignment.submissions?.length === 0 ? (
                  <p className="text-gray-400 text-sm">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedAssignment.submissions?.map((sub: any) => (
                      <div key={sub.id} className={`border rounded p-4 ${
                        sub.status === "GRADED" ? "bg-green-50 border-green-200" : "bg-gray-50"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{sub.student?.name}</p>
                            <p className="text-xs text-gray-400">
                              Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.status === "GRADED" ? (
                              <span className="text-sm font-bold text-green-600">
                                {sub.marks}/{selectedAssignment.totalMarks}
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                                Pending
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGradeForm({ marks: sub.marks || 0, feedback: sub.feedback || "" });
                              }}
                              className="text-blue-600 text-xs hover:underline"
                            >
                              {sub.status === "GRADED" ? "Edit Grade" : "Grade"}
                            </button>
                          </div>
                        </div>

                        {sub.content && (
                          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{sub.content}</p>
                        )}
                        {sub.fileUrl && (

                            <a href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-xs hover:underline mt-2 block"
                          >
                            📎 View Attachment
                          </a>
                        )}
                        {sub.feedback && (
                          <div className="mt-2 bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">Feedback: {sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grading Modal */}
        {gradingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="font-semibold mb-4">Grade Submission</h2>
              <p className="text-sm text-gray-500 mb-4">
                Student: {gradingSubmission.student?.name}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Marks (out of {selectedAssignment?.totalMarks})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedAssignment?.totalMarks}
                    className="w-full border p-2 rounded text-sm"
                    value={gradeForm.marks}
                    onChange={(e) => setGradeForm((prev) => ({ ...prev, marks: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Feedback</label>
                  <textarea
                    placeholder="Write feedback for the student..."
                    className="w-full border p-2 rounded text-sm h-24 resize-none"
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={gradeSubmission}
                  className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Save Grade
                </button>
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}