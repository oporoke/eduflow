"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";

export default function StudentAssignmentsPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    // Pre-fill if already submitted
    const mySubmission = data.submissions?.[0];
    if (mySubmission) {
      setContent(mySubmission.content || "");
      setFileUrl(mySubmission.fileUrl || "");
    } else {
      setContent("");
      setFileUrl("");
    }
  };

  const submitAssignment = async () => {
    if (!content && !fileUrl) return setError("Please add content or upload a file");
    const res = await fetch("/api/assignments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: selectedAssignment.id, content, fileUrl }),
    });
    if (res.ok) {
      setMessage("Assignment submitted successfully!");
      setError("");
      fetchAssignment(selectedAssignment.id);
    }
  };

  const mySubmission = selectedAssignment?.submissions?.[0];
  const isOverdue = selectedAssignment?.dueDate && new Date(selectedAssignment.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assignments</h1>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Assignment List */}
          <div className="col-span-1 space-y-3">
            {assignments.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm">No assignments yet</p>
              </div>
            ) : (
              assignments.map((a) => {
                const submitted = a.submissions?.length > 0;
                const overdue = a.dueDate && new Date(a.dueDate) < new Date();
                return (
                  <div
                    key={a.id}
                    onClick={() => fetchAssignment(a.id)}
                    className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                      selectedAssignment?.id === a.id ? "border-blue-500" :
                      submitted ? "border-green-500" :
                      overdue ? "border-red-500" : "border-transparent"
                    }`}
                  >
                    <h3 className="font-medium text-sm">{a.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        submitted ? "bg-green-100 text-green-600" :
                        overdue ? "bg-red-100 text-red-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {submitted ? "Submitted" : overdue ? "Overdue" : "Pending"}
                      </span>
                    </div>
                    {a.dueDate && (
                      <p className={`text-xs mt-1 ${overdue ? "text-red-500" : "text-gray-400"}`}>
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Assignment Detail */}
          <div className="col-span-2">
            {!selectedAssignment ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select an assignment to view details</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">{selectedAssignment.title}</h2>
                  {selectedAssignment.description && (
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                      {selectedAssignment.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span>Total Marks: {selectedAssignment.totalMarks}</span>
                    {selectedAssignment.dueDate && (
                      <span className={isOverdue ? "text-red-500" : ""}>
                        Due: {new Date(selectedAssignment.dueDate).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Graded Result */}
                {mySubmission?.status === "GRADED" && (
                  <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-green-700">Graded</h3>
                      <span className="text-2xl font-bold text-green-600">
                        {mySubmission.marks}/{selectedAssignment.totalMarks}
                      </span>
                    </div>
                    {mySubmission.feedback && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Teacher Feedback:</p>
                        <p className="text-sm text-gray-700">{mySubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission Form */}
                {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

                {!isOverdue || mySubmission ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Your Answer
                      </label>
                      <textarea
                        placeholder="Write your answer here..."
                        className="w-full border rounded p-3 text-sm h-36 resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={mySubmission?.status === "GRADED"}
                      />
                    </div>

                    {mySubmission?.status !== "GRADED" && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Attach a File (optional)
                        </p>
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) setFileUrl(res[0].url);
                          }}
                          onUploadError={(err) => setError(err.message)}
                        />
                        {fileUrl && (
                          <p className="text-xs text-green-600 mt-1">✓ File attached</p>
                        )}
                      </div>
                    )}

                    {mySubmission?.status !== "GRADED" && (
                      <button
                        onClick={submitAssignment}
                        className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        {mySubmission ? "Resubmit" : "Submit Assignment"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                    <p className="text-red-600 text-sm">This assignment is overdue and can no longer be submitted.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}