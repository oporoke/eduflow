"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SkeletonLoader from "@/components/SkeletonLoader";

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

const METRIC_LABELS: { [key: string]: string } = {
  quizAvg: "Quiz Average",
  submissionRate: "Assignment Submission",
  lessonCompletionRate: "Lesson Completion",
  streak: "Learning Streak",
};

export default function EarlyWarningPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [classroomId, setClassroomId] = useState("");

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

  const getMetricColor = (key: string, value: number) => {
    if (key === "streak") return value === 0 ? "text-red-500" : value < 3 ? "text-yellow-500" : "text-green-500";
    if (value < 40) return "text-red-500";
    if (value < 65) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Early Warning System</h1>
            <p className="text-gray-500 text-sm">Identify at-risk students before they fall behind</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{data.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total Students</p>
            </div>
            <div className="bg-red-50 rounded shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFilter("HIGH")}>
              <p className="text-2xl font-bold text-red-600">{data.highRisk}</p>
              <p className="text-xs text-gray-500 mt-1">🔴 High Risk</p>
            </div>
            <div className="bg-yellow-50 rounded shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFilter("AT_RISK")}>
              <p className="text-2xl font-bold text-yellow-600">{data.atRisk}</p>
              <p className="text-xs text-gray-500 mt-1">🟡 At Risk</p>
            </div>
            <div className="bg-green-50 rounded shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFilter("LOW")}>
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
            <option value="">All Classes</option>
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
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <SkeletonLoader type="list" rows={5} />
              </div>
              <div className="col-span-2">
                <SkeletonLoader type="card" count={1} />
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Student List */}
            <div className="col-span-1 space-y-3 max-h-screen overflow-y-auto">
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
                        <p className="text-xs text-gray-400">{s.student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getScoreColor(s.score)}`}>
                          {s.score}
                        </p>
                        <p className="text-xs text-gray-400">risk score</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-xs px-2 py-0.5 rounded border ${LEVEL_COLORS[s.level]}`}>
                        {LEVEL_ICONS[s.level]} {s.level === "AT_RISK" ? "At Risk" : s.level === "HIGH" ? "High Risk" : "On Track"}
                      </span>
                      <p className="text-xs text-gray-400">{s.signals.length} signal{s.signals.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Student Detail */}
            <div className="col-span-2">
              {!selected ? (
                <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                  <p className="text-4xl mb-3">🎯</p>
                  <p>Select a student to view their risk breakdown</p>
                </div>
              ) : (
                <div className="bg-white rounded shadow p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold">{selected.student.name}</h2>
                      <p className="text-sm text-gray-500">{selected.student.email}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${getScoreColor(selected.score)}`}>
                        {selected.score}
                      </p>
                      <p className="text-xs text-gray-500">Risk Score</p>
                      <span className={`text-xs px-2 py-1 rounded border mt-1 inline-block ${LEVEL_COLORS[selected.level]}`}>
                        {LEVEL_ICONS[selected.level]} {selected.level === "AT_RISK" ? "At Risk" : selected.level === "HIGH" ? "High Risk" : "On Track"}
                      </span>
                    </div>
                  </div>

                  {/* Risk Signals */}
                  {selected.signals.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-sm mb-3">⚠️ Risk Signals</h3>
                      <div className="space-y-2">
                        {selected.signals.map((signal: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-red-50 rounded p-2">
                            <span className="text-red-500 text-sm">•</span>
                            <p className="text-sm text-red-700">{signal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-sm mb-3">📊 Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selected.metrics).map(([key, value]: [string, any]) => {
                        if (key === "lostVotes" || key === "totalVotes") return null;
                        return (
                          <div key={key} className="border rounded p-3">
                            <p className="text-xs text-gray-500 mb-1">{METRIC_LABELS[key] || key}</p>
                            <div className="flex items-end gap-2">
                              <p className={`text-2xl font-bold ${getMetricColor(key, value)}`}>
                                {key === "streak" ? `${value} days` : `${value}%`}
                              </p>
                            </div>
                            {key !== "streak" && (
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    value < 40 ? "bg-red-500" : value < 65 ? "bg-yellow-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pace Votes */}
                  {selected.metrics.totalVotes > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-sm mb-2">🗳️ Pace Votes</h3>
                      <p className="text-sm text-gray-600">
                        {selected.metrics.lostVotes} out of {selected.metrics.totalVotes} votes indicated feeling lost
                        ({Math.round((selected.metrics.lostVotes / selected.metrics.totalVotes) * 100)}%)
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-blue-50 rounded p-4">
                    <h3 className="font-semibold text-sm mb-2 text-blue-700">💡 Recommended Actions</h3>
                    <div className="space-y-1">
                      {selected.metrics.quizAvg < 50 && (
                        <p className="text-sm text-blue-700">• Schedule a quiz revision session for this student</p>
                      )}
                      {selected.metrics.submissionRate < 60 && (
                        <p className="text-sm text-blue-700">• Follow up on missing assignments with student and parent</p>
                      )}
                      {selected.metrics.lessonCompletionRate < 40 && (
                        <p className="text-sm text-blue-700">• Check if student has access issues or needs extra support</p>
                      )}
                      {selected.metrics.streak === 0 && (
                        <p className="text-sm text-blue-700">• Re-engage student — consider a motivational message or badge</p>
                      )}
                      {selected.level === "HIGH" && (
                        <p className="text-sm text-blue-700">• Schedule a parent-teacher meeting urgently</p>
                      )}
                    </div>
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