"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Compassionate", "Study", "Other"];

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-600",
  APPROVED: "bg-green-100 text-green-600",
  REJECTED: "bg-red-100 text-red-600",
};

export default function TeacherLeavePage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Annual", startDate: "", endDate: "", reason: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const res = await fetch("/api/staff/leave");
    const data = await res.json();
    setApplications(data);
  };

  const submitApplication = async () => {
    if (!form.startDate || !form.endDate || !form.reason) {
      return setError("All fields required");
    }
    const res = await fetch("/api/staff/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("Leave application submitted!");
      setShowForm(false);
      setForm({ type: "Annual", startDate: "", endDate: "", reason: "" });
      setError("");
      fetchApplications();
    }
  };

  const getDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Leave Applications</h1>
            <p className="text-gray-500 text-sm">Apply for and track your leave requests</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Apply for Leave
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Application Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Apply for Leave</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Leave Type</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded text-sm"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded text-sm"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              {form.startDate && form.endDate && (
                <p className="text-sm text-blue-600">
                  Duration: {getDays(form.startDate, form.endDate)} days
                </p>
              )}
              <textarea
                placeholder="Reason for leave..."
                className="w-full border p-2 rounded text-sm h-24 resize-none"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
              <button
                onClick={submitApplication}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Submit Application
              </button>
            </div>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No leave applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded shadow p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{app.type} Leave</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(app.startDate).toLocaleDateString()} —{" "}
                      {new Date(app.endDate).toLocaleDateString()} ·{" "}
                      {getDays(app.startDate, app.endDate)} days
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{app.reason}</p>
                    {app.reviewNote && (
                      <div className="mt-2 bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">Admin note: {app.reviewNote}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}