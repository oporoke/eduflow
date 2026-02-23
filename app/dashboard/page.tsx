import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import SearchBar from "@/components/SearchBar";
import GamificationPanel from "@/components/GamificationPanel";
import Leaderboard from "@/components/Leaderboard";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;
  const role = user.role;

  let teacherStats = null;

  if (role === "TEACHER") {
    const classes = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      include: {
        enrollments: true,
        subjects: {
          include: {
            topics: {
              include: {
                subtopics: {
                  include: {
                    lessons: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    teacherStats = classes.map((c) => {
      const totalSubjects = c.subjects.length;
      const totalTopics = c.subjects.reduce((acc, s) => acc + s.topics.length, 0);
      const totalSubtopics = c.subjects.reduce(
        (acc, s) => acc + s.topics.reduce((a, t) => a + t.subtopics.length, 0),
        0
      );
      const totalLessons = c.subjects.reduce(
        (acc, s) =>
          acc +
          s.topics.reduce(
            (a, t) => a + t.subtopics.reduce((b, st) => b + st.lessons.length, 0),
            0
          ),
        0
      );

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        students: c.enrollments.length,
        totalSubjects,
        totalTopics,
        totalSubtopics,
        totalLessons,
      };
    });
  }

  return (
      <main id="main-content">
        <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <LanguageSwitcher />
            <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
            <span className="text-sm text-gray-500 capitalize">{role.toLowerCase()}</span>
          </div>
          <div className="flex gap-4 items-center">
            <LanguageSwitcher />
            <Link href="/announcements" className="text-sm text-gray-600 hover:text-blue-600">
              📢 Announcements
            </Link>
            <SearchBar />
            <NotificationBell/>
            <Link href="/profile" className="text-sm text-blue-600 hover:underline">
              Edit Profile
            </Link>
            <Link href="/api/auth/signout" className="text-sm text-red-500 hover:underline">
              Sign Out
            </Link>
          </div>
        </div>

        {/* ADMIN */}
        {role === "ADMIN" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Administration</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/admin/principal"
                  className="bg-blue-600 text-white rounded shadow p-6 hover:bg-blue-700 transition col-span-full md:col-span-1"
                >
                  <h2 className="text-lg font-semibold">🏫 Principal Dashboard</h2>
                  <p className="text-blue-100 text-sm mt-1">School-wide performance overview — classes, teachers, at-risk students</p>
                </Link>
                <Link href="/admin/ussd" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">📟 USSD & SMS</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure phone numbers and test SMS fallback</p>
                </Link>
                <Link
                  href="/admin/county"
                  className="bg-blue-600 text-white rounded shadow p-6 hover:bg-blue-700 transition"
                >
                  <h2 className="text-lg font-semibold">🗺️ County Network</h2>
                  <p className="text-blue-100 text-sm mt-1">Multi-school performance across Kenya</p>
                </Link>
                <Link href="/admin/classes" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Manage Classes</h2>
                  <p className="text-gray-500 text-sm mt-1">Create and manage classes</p>
                </Link>
                <Link href="/admin/early-warning" className="bg-red-50 border border-red-200 rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold text-red-700">🎯 Early Warning System</h2>
                  <p className="text-gray-500 text-sm mt-1">Identify and support at-risk students</p>
                </Link>
                <Link href="/admin/users" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Manage Users</h2>
                  <p className="text-gray-500 text-sm mt-1">View and manage all users</p>
                </Link>
                <Link href="/admin/observations" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Lesson Observations</h2>
                  <p className="text-gray-500 text-sm mt-1">Schedule and conduct teacher observations</p>
                </Link>
                <Link href="/teacher/meetings" className="bg-white rounded shadow p-4 hover:shadow-md transition block mt-3">
                  <h3 className="font-semibold text-sm">Parent-Teacher Meetings</h3>
                  <p className="text-gray-500 text-xs mt-1">View and manage scheduled meetings with parents</p>
                </Link>
                <Link href="/admin/alerts" className="bg-red-50 border border-red-200 rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold text-red-700">🚨 Emergency Alerts</h2>
                  <p className="text-gray-500 text-sm mt-1">Send urgent notifications to all users</p>
                </Link>
                <Link href="/admin/staff" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Staff Management</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage teacher profiles, leave and performance reviews</p>
                </Link>
                <Link href="/admin/library" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Library</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage books, borrowings and returns</p>
                </Link>
                <Link href="/admin/inventory" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Inventory & Assets</h2>
                  <p className="text-gray-500 text-sm mt-1">Track school equipment and resources</p>
                </Link>
                <Link href="/admin/bursary" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Bursary & Scholarships</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage student financial assistance programs</p>
                </Link>
                <Link href="/admin/budget" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Budget Planning</h2>
                  <p className="text-gray-500 text-sm mt-1">Plan and track school financial budgets</p>
                </Link>
                <Link href="/admin/payroll" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">Payroll</h2>
                  <p className="text-gray-500 text-sm mt-1">Process teacher salaries with Kenya tax calculations</p>
                </Link>
                <Link href="/admin/fees" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                  <h2 className="text-lg font-semibold">💳 Fee Management</h2>
                  <p className="text-gray-500 text-sm mt-1">Set fee structures and track M-Pesa payments</p>
                </Link>
              </div>
            </div>
          )}

        {/* TEACHER */}
        {role === "TEACHER" && teacherStats && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Classes</h2>
              <Link href="/classes" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {teacherStats.length === 0 ? (
              <p className="text-gray-500">You have no classes assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {teacherStats.map((c) => (
                  <div key={c.id} className="bg-white rounded shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{c.name}</h3>
                        {c.description && <p className="text-gray-500 text-sm">{c.description}</p>}
                      </div>
                      <Link href="/teacher/leave" className="bg-white rounded shadow p-4 hover:shadow-md transition block mt-3">
                        <h3 className="font-semibold text-sm">Leave Applications</h3>
                        <p className="text-gray-500 text-xs mt-1">Apply for and track your leave requests</p>
                      </Link>
                      <Link href="/teacher/early-warning" className="bg-red-50 border border-red-100 rounded shadow p-4 hover:shadow-md transition block mt-3">
                        <h3 className="font-semibold text-sm text-red-700">🎯 Early Warning</h3>
                        <p className="text-gray-500 text-xs mt-1">Monitor at-risk students in your classes</p>
                      </Link>
                      <Link
                        href={`/teacher/curriculum/${c.id}`}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      >
                        Curriculum
                      </Link>
                      <Link
                        href={`/teacher/analytics/${c.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Analytics
                      </Link>
                      <Link
                        href={`/teacher/iep/${c.id}`}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        IEPs
                      </Link>
                      <Link
                      href={`/teacher/competencies/${c.id}`}
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                    >
                      Competencies
                    </Link>
                      <Link
                        href={`/teacher/calendar/${c.id}`}
                        className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                      >
                        Calendar
                      </Link>
                      <Link
                        href={`/teacher/assignments/${c.id}`}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                      >
                        Assignments
                      </Link>
                      <Link
                        href={`/teacher/rubrics/${c.id}`}
                        className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700"
                      >
                        Rubrics
                      </Link>
                        <Link href="/teacher/observations" className="bg-white rounded shadow p-4 hover:shadow-md transition block">
                        <h3 className="font-semibold text-sm">My Observations</h3>
                        <p className="text-gray-500 text-xs mt-1">View feedback from lesson observations</p>
                      </Link>
                      <Link
                        href={`/teacher/timetable/${c.id}`}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        Timetable
                      </Link>
                      <Link href="/teacher/payslips" className="bg-white rounded shadow p-4 hover:shadow-md transition block mt-3">
                        <h3 className="font-semibold text-sm">My Payslips</h3>
                        <p className="text-gray-500 text-xs mt-1">View your monthly salary statements</p>
                      </Link>
                      <Link
                          href="/student/tutor"
                          className="bg-blue-600 text-white rounded shadow p-6 hover:bg-blue-700 transition block"
                        >
                          <h2 className="text-lg font-semibold">🤖 EduBot — AI Tutor</h2>
                          <p className="text-blue-100 text-sm mt-1">Get instant help from your AI tutor, 24/7</p>
                        </Link>
                                            <Link
                        href={`/student/learning-path/${c.id}`}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      >
                        🧠 My Path
                      </Link>
                      <Link
                      href={`/student/study-groups/${c.id}`}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      👥 Groups
                    </Link>
                      <Link href="/student/fees" className="bg-green-50 border border-green-200 rounded shadow p-6 hover:shadow-md transition">
                        <h2 className="text-lg font-semibold text-green-700">💚 School Fees</h2>
                        <p className="text-gray-500 text-sm mt-1">View and pay school fees via M-Pesa</p>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-blue-50 rounded p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{c.students}</p>
                        <p className="text-xs text-gray-500">Students</p>
                      </div>
                      <div className="bg-green-50 rounded p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{c.totalSubjects}</p>
                        <p className="text-xs text-gray-500">Subjects</p>
                      </div>
                      <div className="bg-yellow-50 rounded p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{c.totalTopics}</p>
                        <p className="text-xs text-gray-500">Topics</p>
                      </div>
                      <div className="bg-purple-50 rounded p-3 text-center">
                        <p className="text-2xl font-bold text-purple-600">{c.totalLessons}</p>
                        <p className="text-xs text-gray-500">Lessons</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded shadow p-6">
                      <h2 className="text-lg font-semibold text-purple-700">🧠 Adaptive Learning Paths</h2>
                      <p className="text-gray-500 text-sm mt-1">Personalized study recommendations based on your performance</p>
                      <p className="text-xs text-gray-400 mt-2">Click "My Path" on any class card above</p>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STUDENT */}
        {/* STUDENT */}
        {role === "STUDENT" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Learning</h2>
              <Link href="/classes" className="text-sm text-blue-600 hover:underline">
                View All Classes
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/classes" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                    <h2 className="text-lg font-semibold">My Classes</h2>
                    <p className="text-gray-500 text-sm mt-1">Browse your enrolled classes and lessons</p>
                  </Link>
                  <Link href="/student/browse" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                    <h2 className="text-lg font-semibold">Browse Classes</h2>
                    <p className="text-gray-500 text-sm mt-1">Find and enroll in available classes</p>
                  </Link>
                  <Link href="/student/portfolio" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                    <h2 className="text-lg font-semibold">My Portfolio</h2>
                    <p className="text-gray-500 text-sm mt-1">Showcase your best work and achievements</p>
                  </Link>
                  <Link href="/student/library" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                    <h2 className="text-lg font-semibold">Library</h2>
                    <p className="text-gray-500 text-sm mt-1">Browse and borrow books</p>
                  </Link>
                  <Link href="/student/bursary" className="bg-white rounded shadow p-6 hover:shadow-md transition">
                    <h2 className="text-lg font-semibold">Bursary & Scholarships</h2>
                    <p className="text-gray-500 text-sm mt-1">Apply for financial assistance</p>
                  </Link>
                </div>
                <Leaderboard />
              </div>
              <div>
                <GamificationPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      </main>
  );
}
