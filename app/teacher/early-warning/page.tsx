"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const LEVEL_COLORS: { [key: string]: string } = {
  HIGH: "bg-red-100 text-red-700 border-red-300",
  AT_RISK: "bg-yellow-100 text-yellow-700 border-yellow-300",
  LOW: "bg-green-100 text-green-700 border-green-300",
};

const LEVEL_ICONS: { [key: string]: string } = {
  HIGH: "🔴",
  AT_RISK: "🟡",
  LOW: "🟢",
};

export default function TeacherEarlyWarningPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    fetchData();
  }, [classroomId]);

  const fetchClassrooms = async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClassrooms(data);
  };

  const fetchData = async () => {
    setLoading(true);
    const url = classroomId
      ? `/api/early-warning?classroomId=${classroomId}`
      : "/api/early-warning";
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const filtered = data?.students?.filter((s: any) =>
    filter === "ALL" ? true : s.level === filter
  ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Student Early Warning</h1>
            <p className="text-gray-500 text-sm">Monitor at-risk students in your classes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {/* Summary */}
        {data && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 rounded shadow p-4 text-center cursor-pointer" onClick={() => setFilter("HIGH")}>
              <p className="text-2xl font-bold text-red-600">{data.highRisk}</p>
              <p className="text-xs text-gray-500 mt-1">🔴 High Risk</p>
            </div>
            <div className="bg-yellow-50 rounded shadow p-4 text-center cursor-pointer" onClick={() => setFilter("AT_RISK")}>
              <p className="text-2xl font-bold text-yellow-600">{data.atRisk}</p>
              <p className="text-xs text-gray-500 mt-1">🟡 At Risk</p>
            </div>
            <div className="bg-green-50 rounded shadow p-4 text-center cursor-pointer" onClick={() => setFilter("LOW")}>
              <p className="text-2xl font-bold text-green-600">{data.lowRisk}</p>
              <p className="text-xs text-gray-500 mt-1">🟢 On Track</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select
            className="border p-2 rounded text-sm"
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
          >
            <option value="">All My Classes</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            {["ALL", "HIGH", "AT_RISK", "LOW"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1.5 rounded text-sm border ${
                  filter === level
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {level === "ALL" ? "All" : level === "AT_RISK" ? "At Risk" : level === "HIGH" ? "🔴 High Risk" : "🟢 On Track"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3 animate-pulse">⏳</p>
            <p>Analyzing student data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-6">
            {/* List */}
            <div className="col-span-2 space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm">No students in this category</p>
                </div>
              ) : (
                filtered.map((s: any) => (
                  <div
                    key={s.student.id}
                    onClick={() => setSelected(s)}
                    className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                      selected?.student.id === s.student.id
                        ? "border-blue-500"
                        : s.level === "HIGH"
                        ? "border-red-500"
                        : s.level === "AT_RISK"
                        ? "border-yellow-500"
                        : "border-green-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{s.student.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${LEVEL_COLORS[s.level]}`}>
                          {LEVEL_ICONS[s.level]} {s.level === "AT_RISK" ? "At Risk" : s.level === "HIGH" ? "High Risk" : "On Track"}
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(s.score)}`}>{s.score}</p>
                    </div>
                    {s.signals.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2 truncate">⚠️ {s.signals[0]}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Detail */}
            <div className="col-span-3">
              {!selected ? (
                <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                  <p className="text-4xl mb-3">🎯</p>
                  <p>Select a student to view details</p>
                </div>
              ) : (
                <div className="bg-white rounded shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-bold">{selected.student.name}</h2>
                      <p className="text-sm text-gray-500">{selected.student.email}</p>
                    </div>
                    <p className={`text-4xl font-bold ${getScoreColor(selected.score)}`}>
                      {selected.score}
                    </p>
                  </div>

                  {selected.signals.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-sm mb-2">⚠️ Risk Signals</h3>
                      {selected.signals.map((signal: string, i: number) => (
                        <div key={i} className="bg-red-50 rounded p-2 mb-1">
                          <p className="text-sm text-red-700">• {signal}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="border rounded p-3 text-center">
                      <p className="text-xs text-gray-500">Quiz Average</p>
                      <p className={`text-xl font-bold ${selected.metrics.quizAvg < 50 ? "text-red-500" : "text-green-500"}`}>
                        {selected.metrics.quizAvg}%
                      </p>
                    </div>
                    <div className="border rounded p-3 text-center">
                      <p className="text-xs text-gray-500">Assignments Submitted</p>
                      <p className={`text-xl font-bold ${selected.metrics.submissionRate < 60 ? "text-red-500" : "text-green-500"}`}>
                        {selected.metrics.submissionRate}%
                      </p>
                    </div>
                    <div className="border rounded p-3 text-center">
                      <p className="text-xs text-gray-500">Lessons Completed</p>
                      <p className={`text-xl font-bold ${selected.metrics.lessonCompletionRate < 40 ? "text-red-500" : "text-green-500"}`}>
                        {selected.metrics.lessonCompletionRate}%
                      </p>
                    </div>
                    <div className="border rounded p-3 text-center">
                      <p className="text-xs text-gray-500">Learning Streak</p>
                      <p className={`text-xl font-bold ${selected.metrics.streak === 0 ? "text-red-500" : "text-green-500"}`}>
                        {selected.metrics.streak} days
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded p-4">
                    <h3 className="font-semibold text-sm mb-2 text-blue-700">💡 Actions</h3>
                    {selected.metrics.quizAvg < 50 && (
                      <p className="text-sm text-blue-700">• Schedule a quiz revision session</p>
                    )}
                    {selected.metrics.submissionRate < 60 && (
                      <p className="text-sm text-blue-700">• Follow up on missing assignments</p>
                    )}
                    {selected.metrics.lessonCompletionRate < 40 && (
                      <p className="text-sm text-blue-700">• Check if student needs extra support</p>
                    )}
                    {selected.metrics.streak === 0 && (
                      <p className="text-sm text-blue-700">• Re-engage student with a motivational message</p>
                    )}
                    {selected.level === "HIGH" && (
                      <p className="text-sm text-blue-700 font-medium">• 🚨 Schedule urgent parent-teacher meeting</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}