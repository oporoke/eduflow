"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SkeletonLoader, { SkeletonStats } from "@/components/SkeletonLoader";

export default function PrincipalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/principal");
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };



  // Replace the loading return with:
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-96 mb-8 animate-pulse" />
          <SkeletonStats count={4} />
          <div className="mt-4">
            <SkeletonStats count={4} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6">
            <SkeletonLoader type="card" count={3} />
            <SkeletonLoader type="list" rows={4} />
          </div>
        </div>
      </div>
    );
  }

  const { overview, classPerformance, teacherActivity, recentActivity } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">School Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Real-time overview of school performance · {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl font-bold text-blue-600">{overview.totalStudents}</p>
            <p className="text-sm text-gray-500 mt-1">👨‍🎓 Total Students</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl font-bold text-purple-600">{overview.totalTeachers}</p>
            <p className="text-sm text-gray-500 mt-1">👨‍🏫 Teachers</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl font-bold text-green-600">{overview.totalClassrooms}</p>
            <p className="text-sm text-gray-500 mt-1">🏫 Classes</p>
          </div>
          <div className={`rounded-xl shadow p-5 ${overview.schoolAvgScore >= 70 ? "bg-green-50" : overview.schoolAvgScore >= 50 ? "bg-yellow-50" : "bg-red-50"}`}>
            <p className={`text-3xl font-bold ${getScoreColor(overview.schoolAvgScore)}`}>
              {overview.schoolAvgScore}%
            </p>
            <p className="text-sm text-gray-500 mt-1">📊 School Average</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl font-bold text-indigo-600">{overview.totalLessons}</p>
            <p className="text-sm text-gray-500 mt-1">📚 Lessons Created</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl font-bold text-teal-600">{overview.totalQuizzes}</p>
            <p className="text-sm text-gray-500 mt-1">📝 Quizzes</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-3xl font-bold text-orange-600">{overview.totalAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">📋 Assignments</p>
          </div>
          <div className={`rounded-xl shadow p-5 ${overview.atRiskCount === 0 ? "bg-green-50" : overview.atRiskCount > 10 ? "bg-red-50" : "bg-yellow-50"}`}>
            <p className={`text-3xl font-bold ${overview.atRiskCount === 0 ? "text-green-600" : overview.atRiskCount > 10 ? "text-red-600" : "text-yellow-600"}`}>
              {overview.atRiskCount}
            </p>
            <p className="text-sm text-gray-500 mt-1">🚨 At-Risk Students</p>
            {overview.atRiskCount > 0 && (
              <Link href="/admin/early-warning" className="text-xs text-blue-600 hover:underline mt-1 block">
                View details →
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["overview", "classes", "teachers", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm capitalize border ${
                activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab === "overview" ? "📊 Overview" :
               tab === "classes" ? "🏫 Classes" :
               tab === "teachers" ? "👨‍🏫 Teachers" : "📋 Activity"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Top performing classes */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">🏆 Class Performance Ranking</h2>
              <div className="space-y-3">
                {[...classPerformance]
                  .sort((a, b) => b.avgScore - a.avgScore)
                  .slice(0, 5)
                  .map((cls, i) => (
                    <div key={cls.id} className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium">{cls.name}</p>
                          <p className={`text-sm font-bold ${getScoreColor(cls.avgScore)}`}>
                            {cls.avgScore}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${getScoreBg(cls.avgScore)}`}
                            style={{ width: `${cls.avgScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Teacher Activity */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">👨‍🏫 Teacher Activity (Last 30 Days)</h2>
              <div className="space-y-3">
                {teacherActivity.map((teacher: any) => (
                  <div key={teacher.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${teacher.active ? "bg-green-500" : "bg-red-400"}`} />
                      <div>
                        <p className="text-sm font-medium">{teacher.name}</p>
                        <p className="text-xs text-gray-400">{teacher.classCount} class{teacher.classCount !== 1 ? "es" : ""}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${teacher.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                      {teacher.recentLessons} lesson{teacher.recentLessons !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">📢 Recent Announcements</h2>
              {recentActivity.announcements.length === 0 ? (
                <p className="text-gray-400 text-sm">No announcements yet</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.announcements.map((a: any) => (
                    <div key={a.id} className="border-l-4 border-blue-300 pl-3">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-gray-400">
                        By {a.author} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">⚡ Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/early-warning" className="bg-red-50 border border-red-200 rounded p-3 hover:shadow-md transition text-center">
                  <p className="text-xl mb-1">🎯</p>
                  <p className="text-xs font-medium text-red-700">Early Warning</p>
                </Link>
                <Link href="/announcements" className="bg-blue-50 border border-blue-200 rounded p-3 hover:shadow-md transition text-center">
                  <p className="text-xl mb-1">📢</p>
                  <p className="text-xs font-medium text-blue-700">Announcements</p>
                </Link>
                <Link href="/admin/staff" className="bg-purple-50 border border-purple-200 rounded p-3 hover:shadow-md transition text-center">
                  <p className="text-xl mb-1">👥</p>
                  <p className="text-xs font-medium text-purple-700">Staff</p>
                </Link>
                <Link href="/admin/alerts" className="bg-orange-50 border border-orange-200 rounded p-3 hover:shadow-md transition text-center">
                  <p className="text-xl mb-1">🚨</p>
                  <p className="text-xs font-medium text-orange-700">Alerts</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Class</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Teacher</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Students</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Avg Score</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Coverage</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Assignments</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {classPerformance.map((cls: any) => (
                  <tr key={cls.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-sm">{cls.name}</td>
                    <td className="p-4 text-sm text-gray-600">{cls.teacher?.name}</td>
                    <td className="p-4 text-sm">{cls.studentCount}</td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${getScoreColor(cls.avgScore)}`}>
                        {cls.avgScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getScoreBg(cls.coverageRate)}`}
                            style={{ width: `${cls.coverageRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{cls.coverageRate}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{cls.totalAssignments}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        cls.avgScore >= 70 ? "bg-green-100 text-green-600" :
                        cls.avgScore >= 50 ? "bg-yellow-100 text-yellow-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {cls.avgScore >= 70 ? "On Track" : cls.avgScore >= 50 ? "Needs Support" : "At Risk"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === "teachers" && (
          <div className="grid grid-cols-2 gap-4">
            {teacherActivity.map((teacher: any) => (
              <div key={teacher.id} className={`bg-white rounded-xl shadow p-5 border-l-4 ${teacher.active ? "border-green-500" : "border-red-400"}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{teacher.name}</p>
                      <p className="text-xs text-gray-400">{teacher.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${teacher.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                    {teacher.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-lg font-bold text-blue-600">{teacher.classCount}</p>
                    <p className="text-xs text-gray-400">Classes</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-lg font-bold text-green-600">{teacher.recentLessons}</p>
                    <p className="text-xs text-gray-400">Lessons (30d)</p>
                  </div>
                </div>
                {!teacher.active && (
                  <p className="text-xs text-red-500 mt-2">⚠️ No lessons posted in the last 30 days</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">📚 Recent Lessons</h2>
              <div className="space-y-3">
                {recentActivity.lessons.map((l: any) => (
                  <div key={l.id} className="border-l-4 border-blue-300 pl-3">
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="text-xs text-gray-400">
                      {l.className} · {l.teacher} · {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">📋 Recent Submissions</h2>
              <div className="space-y-3">
                {recentActivity.submissions.map((s: any) => (
                  <div key={s.id} className="border-l-4 border-green-300 pl-3">
                    <p className="text-sm font-medium">{s.student}</p>
                    <p className="text-xs text-gray-400">
                      {s.assignment} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}