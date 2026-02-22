"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: { [key: string]: string } = {
  SCHEDULED: "bg-blue-100 text-blue-600",
  COMPLETED: "bg-green-100 text-green-600",
  CANCELLED: "bg-red-100 text-red-600",
  RESCHEDULED: "bg-yellow-100 text-yellow-600",
};

export default function ParentMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    teacherId: "",
    studentId: "",
    date: "",
    duration: 30,
    venue: "",
    agenda: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [parentId, setParentId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [meetingsRes, childrenRes, teachersRes] = await Promise.all([
      fetch("/api/meetings"),
      fetch("/api/parent/children"),
      fetch("/api/users?role=TEACHER"),
    ]);

    if (meetingsRes.status === 401) { router.push("/parent/login"); return; }

    const meetingsData = await meetingsRes.json();
    const childrenData = await childrenRes.json();
    const teachersData = await teachersRes.json();

    setMeetings(meetingsData);
    setChildren(childrenData);
    setTeachers(teachersData);

    // Get parent ID from cookie
    const res = await fetch("/api/parent/children");
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) setParentId(data[0].parentId);
    }
  };

  const scheduleMeeting = async () => {
    if (!form.teacherId || !form.studentId || !form.date) {
      return setError("Teacher, student and date are required");
    }

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parentId }),
    });

    if (res.ok) {
      setMessage("Meeting scheduled!");
      setShowForm(false);
      setForm({ teacherId: "", studentId: "", date: "", duration: 30, venue: "", agenda: "" });
      fetchData();
    }
  };

  const cancelMeeting = async (meetingId: string) => {
    await fetch("/api/meetings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, status: "CANCELLED" }),
    });
    fetchData();
  };

  const upcoming = meetings.filter((m) => new Date(m.date) >= new Date() && m.status === "SCHEDULED");
  const past = meetings.filter((m) => new Date(m.date) < new Date() || m.status !== "SCHEDULED");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Parent-Teacher Meetings</h1>
            <p className="text-gray-500 text-sm">Schedule and manage meetings with teachers</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Request Meeting
            </button>
            <button onClick={() => router.push("/parent/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {/* Schedule Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Request Meeting</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Child</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.studentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
                >
                  <option value="">Select child</option>
                  {children.map((c) => (
                    <option key={c.student.id} value={c.student.id}>{c.student.name}</option>
                  ))}
                </select>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs text-gray-500 mb-1 block">Duration (mins)</label>
                  <select
                    className="w-full border p-2 rounded text-sm"
                    value={form.duration}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration: parseInt(e.target.value) }))}
                  >
                    {[15, 30, 45, 60].map((d) => (
                      <option key={d} value={d}>{d} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                type="text"
                placeholder="Venue (e.g. Staff Room, Online)"
                className="w-full border p-2 rounded text-sm"
                value={form.venue}
                onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
              />
              <textarea
                placeholder="Agenda — what would you like to discuss?"
                className="w-full border p-2 rounded text-sm h-20 resize-none"
                value={form.agenda}
                onChange={(e) => setForm((prev) => ({ ...prev, agenda: e.target.value }))}
              />
              <button
                onClick={scheduleMeeting}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Request Meeting
              </button>
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Upcoming ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded shadow p-6 text-center text-gray-400">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm">No upcoming meetings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <div key={m.id} className="bg-white rounded shadow p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{m.student?.name}</h3>
                      <p className="text-sm text-gray-500">Teacher: {m.teacher?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(m.date).toLocaleString()} · {m.duration} mins
                      </p>
                      {m.venue && <p className="text-sm text-gray-500">Venue: {m.venue}</p>}
                      {m.agenda && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          Agenda: {m.agenda}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[m.status]}`}>
                        {m.status}
                      </span>
                      <button
                        onClick={() => cancelMeeting(m.id)}
                        className="text-red-400 text-xs hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Past Meetings</h2>
            <div className="space-y-3">
              {past.map((m) => (
                <div key={m.id} className="bg-white rounded shadow p-5 opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{m.student?.name}</h3>
                      <p className="text-sm text-gray-500">Teacher: {m.teacher?.name}</p>
                      <p className="text-sm text-gray-500">{new Date(m.date).toLocaleString()}</p>
                      {m.notes && (
                        <div className="mt-2 bg-blue-50 rounded p-2">
                          <p className="text-xs text-gray-500 mb-1">Meeting Notes:</p>
                          <p className="text-sm text-gray-700">{m.notes}</p>
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[m.status]}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}