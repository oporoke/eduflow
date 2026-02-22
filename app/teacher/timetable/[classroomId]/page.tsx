"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00",
  "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00",
];

const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

export default function TimetablePage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [timetable, setTimetable] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    day: "Monday",
    startTime: "08:00",
    endTime: "09:00",
    subjectId: "",
    teacherId: "",
    room: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [timetableRes, subjectsRes, teachersRes] = await Promise.all([
      fetch(`/api/timetable?classroomId=${classroomId}`),
      fetch(`/api/subjects?classroomId=${classroomId}`),
      fetch("/api/users?role=TEACHER"),
    ]);
    const timetableData = await timetableRes.json();
    const subjectsData = await subjectsRes.json();
    const teachersData = await teachersRes.json();
    setTimetable(timetableData);
    setSubjects(subjectsData);
    setTeachers(teachersData);
  };

  const addSlot = async () => {
    if (!form.subjectId || !form.teacherId) return setError("Subject and teacher required");
    setError("");
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classroomId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Slot added!");
      setShowForm(false);
      fetchData();
    }
  };

  const deleteSlot = async (id: string) => {
    await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // Build color map for subjects
  const subjectColorMap: { [key: string]: string } = {};
  subjects.forEach((s, i) => {
    subjectColorMap[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
  });

  // Group slots by day
  const slotsByDay: { [day: string]: any[] } = {};
  DAYS.forEach((d) => { slotsByDay[d] = []; });
  timetable?.slots?.forEach((slot: any) => {
    if (slotsByDay[slot.day]) slotsByDay[slot.day].push(slot);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Class Timetable</h1>
            <p className="text-gray-500 text-sm">Weekly schedule for this class</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Add Slot
            </button>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Add Slot Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Add Timetable Slot</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Day</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.day}
                  onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                >
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                >
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.subjectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Room (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Room 4A"
                  className="w-full border p-2 rounded text-sm"
                  value={form.room}
                  onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                />
              </div>
            </div>
            <button
              onClick={addSlot}
              className="mt-3 bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
            >
              Add Slot
            </button>
          </div>
        )}

        {/* Subject Legend */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {subjects.map((s, i) => (
              <span
                key={s.id}
                className={`text-xs px-2 py-1 rounded border ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}
              >
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Timetable Grid */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="grid grid-cols-6 border-b">
            <div className="p-3 bg-gray-50 font-medium text-sm text-gray-600">Time</div>
            {DAYS.map((day) => (
              <div key={day} className="p-3 bg-gray-50 font-medium text-sm text-gray-600 text-center border-l">
                {day}
              </div>
            ))}
          </div>

          {timetable?.slots?.length === 0 || !timetable ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p>No slots yet. Click + Add Slot to build the timetable.</p>
            </div>
          ) : (
            <div>
              {/* Get unique time ranges */}
              {[...new Set(timetable?.slots?.map((s: any) => s.startTime))]
                .sort()
                .map((startTime: any) => {
                  const rowSlots = timetable?.slots?.filter((s: any) => s.startTime === startTime);
                  const endTime = rowSlots?.[0]?.endTime;
                  return (
                    <div key={startTime} className="grid grid-cols-6 border-b hover:bg-gray-50">
                      <div className="p-3 text-xs text-gray-500 flex items-center">
                        {startTime} - {endTime}
                      </div>
                      {DAYS.map((day) => {
                        const slot = slotsByDay[day]?.find((s) => s.startTime === startTime);
                        return (
                          <div key={day} className="p-2 border-l min-h-16 flex items-center">
                            {slot ? (
                              <div className={`w-full rounded p-2 border text-xs ${subjectColorMap[slot.subjectId]}`}>
                                <p className="font-medium">{slot.subject?.name}</p>
                                <p className="opacity-75">{slot.teacher?.name}</p>
                                {slot.room && <p className="opacity-60">{slot.room}</p>}
                                <button
                                  onClick={() => deleteSlot(slot.id)}
                                  className="mt-1 text-red-400 hover:underline text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}