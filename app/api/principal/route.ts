import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Core counts
  const [
    totalStudents,
    totalTeachers,
    totalClassrooms,
    totalLessons,
    totalQuizzes,
    totalAssignments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.classroom.count(),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.assignment.count(),
  ]);

  // Quiz performance school-wide
  const quizAttempts = await prisma.quizAttempt.findMany({
    select: { score: true, total: true },
  });
  const schoolAvgScore = quizAttempts.length
    ? Math.round(
        quizAttempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) /
          quizAttempts.length
      )
    : 0;

  // Class-by-class performance
  const classrooms = await prisma.classroom.findMany({
    include: {
      teacher: { select: { id: true, name: true } },
      enrollments: {
        include: {
          student: {
            include: {
              quizAttempts: { select: { score: true, total: true } },
              lessonProgress: { where: { completed: true }, select: { lessonId: true } },
            },
          },
        },
      },
      subjects: {
        include: {
          topics: {
            include: {
              subtopics: {
                include: { lessons: true },
              },
            },
          },
        },
      },
      assignments: true,
    },
  });

  const classPerformance = classrooms.map((classroom) => {
    const students = classroom.enrollments.map((e) => e.student);
    const allAttempts = students.flatMap((s) => s.quizAttempts);
    const avgScore = allAttempts.length
      ? Math.round(
          allAttempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) /
            allAttempts.length
        )
      : 0;

    // Curriculum coverage
    const totalSubtopics = classroom.subjects.flatMap((s) =>
      s.topics.flatMap((t) => t.subtopics)
    ).length;
    const totalLessonsInClass = classroom.subjects.flatMap((s) =>
      s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.lessons))
    ).length;
    const completedLessons = students.flatMap((s) => s.lessonProgress).length;
    const coverageRate = totalLessonsInClass > 0
      ? Math.round((completedLessons / (totalLessonsInClass * Math.max(students.length, 1))) * 100)
      : 0;

    return {
      id: classroom.id,
      name: classroom.name,
      teacher: classroom.teacher,
      studentCount: students.length,
      avgScore,
      coverageRate: Math.min(coverageRate, 100),
      totalAssignments: classroom.assignments.length,
      totalSubtopics,
    };
  });

  // Teacher activity (lessons created in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      taughtClasses: {
        include: {
          subjects: {
            include: {
              topics: {
                include: {
                  subtopics: {
                    include: {
                      lessons: {
                        where: { createdAt: { gte: thirtyDaysAgo } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const teacherActivity = teachers.map((teacher) => {
    const recentLessons = teacher.taughtClasses.flatMap((c) =>
      c.subjects.flatMap((s) =>
        s.topics.flatMap((t) =>
          t.subtopics.flatMap((st) => st.lessons)
        )
      )
    ).length;

    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      recentLessons,
      classCount: teacher.taughtClasses.length,
      active: recentLessons > 0,
    };
  });

  // Recent activity
  const recentLessons = await prisma.lesson.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      subtopic: {
        include: {
          topic: {
            include: {
              subject: {
                include: { classroom: { include: { teacher: { select: { name: true } } } } },
              },
            },
          },
        },
      },
    },
  });

  const recentSubmissions = await prisma.assignmentSubmission.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { name: true } },
      assignment: { select: { title: true } },
    },
  });

  const recentAnnouncements = await prisma.announcement.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  // At-risk count (simplified)
  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      quizAttempts: { select: { score: true, total: true } },
      userPoints: { select: { streak: true } },
    },
  });

  const atRiskCount = allStudents.filter((student) => {
    const attempts = student.quizAttempts;
    const avgScore = attempts.length
      ? attempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) / attempts.length
      : 100;
    const streak = student.userPoints?.streak || 0;
    return avgScore < 50 || streak === 0;
  }).length;

  return NextResponse.json({
    overview: {
      totalStudents,
      totalTeachers,
      totalClassrooms,
      totalLessons,
      totalQuizzes,
      totalAssignments,
      schoolAvgScore,
      atRiskCount,
    },
    classPerformance,
    teacherActivity,
    recentActivity: {
      lessons: recentLessons.map((l) => ({
        id: l.id,
        title: l.title,
        className: l.subtopic?.topic?.subject?.classroom?.name,
        teacher: l.subtopic?.topic?.subject?.classroom?.teacher?.name,
        createdAt: l.createdAt,
      })),
      submissions: recentSubmissions.map((s) => ({
        id: s.id,
        student: s.student?.name,
        assignment: s.assignment?.title,
        createdAt: s.createdAt,
      })),
      announcements: recentAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        author: a.author?.name,
        createdAt: a.createdAt,
      })),
    },
  });
}