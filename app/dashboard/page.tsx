import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import SearchBar from "@/components/SearchBar";
import GamificationPanel from "@/components/GamificationPanel";
import Leaderboard from "@/components/Leaderboard";

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
            <span className="text-sm text-gray-500 capitalize">{role.toLowerCase()}</span>
          </div>
          <div className="flex gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/classes" className="bg-white rounded shadow p-6 hover:shadow-md transition">
              <h2 className="text-lg font-semibold">Manage Classes</h2>
              <p className="text-gray-500 text-sm mt-1">Create classes and enroll students</p>
            </Link>
            <Link href="/admin/users" className="bg-white rounded shadow p-6 hover:shadow-md transition">
              <h2 className="text-lg font-semibold">Manage Users</h2>
              <p className="text-gray-500 text-sm mt-1">View and manage all users</p>
            </Link>
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
  );
}
