"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: { [key: string]: string } = {
  SCHEDULED: "bg-blue-100 text-blue-600",
  COMPLETED: "bg-green-100 text-green-600",
  CANCELLED: "bg-red-100 text-red-600",
  RESCHEDULED: "bg-yellow-100 text-yellow-600",
};

export default function TeacherMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const res = await fetch("/api/meetings");
    const data = await res.json();
    setMeetings(data);
  };

  const updateMeeting = async (meetingId: string, updates: any) => {
    await fetch("/api/meetings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, ...updates }),
    });
    setMessage("Meeting updated!");
    fetchMeetings();
    setSelected(null);
  };

  const upcoming = meetings.filter((m) => new Date(m.date) >= new Date() && m.status === "SCHEDULED");
  const past = meetings.filter((m) => new Date(m.date) < new Date() || m.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Parent-Teacher Meetings</h1>
            <p className="text-gray-500 text-sm">View and manage scheduled meetings</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Upcoming Meetings */}
        <div className="mb-8">
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
                      <p className="text-sm text-gray-500">Parent: {m.parent?.name}</p>
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
                        onClick={() => { setSelected(m); setNotes(m.notes || ""); }}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Add Notes
                      </button>
                      <button
                        onClick={() => updateMeeting(m.id, { status: "COMPLETED" })}
                        className="text-green-600 text-xs hover:underline"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => updateMeeting(m.id, { status: "CANCELLED" })}
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

        {/* Past Meetings */}
        <div>
          <h2 className="font-semibold mb-3">Past Meetings ({past.length})</h2>
          {past.length === 0 ? (
            <p className="text-gray-400 text-sm">No past meetings</p>
          ) : (
            <div className="space-y-3">
              {past.map((m) => (
                <div key={m.id} className="bg-white rounded shadow p-5 opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{m.student?.name}</h3>
                      <p className="text-sm text-gray-500">Parent: {m.parent?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(m.date).toLocaleString()} · {m.duration} mins
                      </p>
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
          )}
        </div>

        {/* Notes Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="font-semibold mb-4">Meeting Notes — {selected.student?.name}</h2>
              <textarea
                placeholder="Write meeting notes here..."
                className="w-full border rounded p-3 text-sm h-36 resize-none mb-4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateMeeting(selected.id, { notes, status: "COMPLETED" })}
                  className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Save & Complete
                </button>
                <button
                  onClick={() => setSelected(null)}
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