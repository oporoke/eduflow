import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getCached, setCached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cacheKey = "principal-dashboard";
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Core counts in parallel
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

  // Quiz performance — select only needed fields
  const quizAttempts = await prisma.quizAttempt.findMany({
    select: { score: true, maxScore: true },
  });

  const schoolAvgScore = quizAttempts.length
    ? Math.round(
        quizAttempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) /
          quizAttempts.length
      )
    : 0;

  // Class performance — lean query
  const classrooms = await prisma.classroom.findMany({
    select: {
      id: true,
      name: true,
      teacher: { select: { id: true, name: true } },
      enrollments: { select: { userId: true } },
      assignments: { select: { id: true } },
      subjects: {
        select: {
          topics: {
            select: {
              subtopics: {
                select: {
                  lessons: { select: { id: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Get quiz attempts per student in bulk
  const allStudentIds = classrooms.flatMap((c) => c.enrollments.map((e) => e.userId));
  const uniqueStudentIds = [...new Set(allStudentIds)];

  const [allAttempts, allLessonProgress] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId: { in: uniqueStudentIds } },
      select: { userId: true, score: true, maxScore: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: { in: uniqueStudentIds }, completed: true },
      select: { userId: true, lessonId: true },
    }),
  ]);

  // Build lookup maps
  const attemptsByUser = new Map<string, { score: number; maxScore: number }[]>();
  for (const attempt of allAttempts) {
    if (!attemptsByUser.has(attempt.userId)) attemptsByUser.set(attempt.userId, []);
    attemptsByUser.get(attempt.userId)!.push(attempt);
  }

  const progressByUser = new Map<string, Set<string>>();
  for (const progress of allLessonProgress) {
    if (!progressByUser.has(progress.userId)) progressByUser.set(progress.userId, new Set());
    progressByUser.get(progress.userId)!.add(progress.lessonId);
  }

  const classPerformance = classrooms.map((classroom) => {
    const studentIds = classroom.enrollments.map((e) => e.userId);
    const classAttempts = studentIds.flatMap((id) => attemptsByUser.get(id) || []);

    const avgScore = classAttempts.length
      ? Math.round(
          classAttempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) /
            classAttempts.length
        )
      : 0;

    const totalLessonsInClass = classroom.subjects
      .flatMap((s) => s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.lessons)))
      .length;

    const completedLessons = studentIds.reduce((acc, id) => {
      return acc + (progressByUser.get(id)?.size || 0);
    }, 0);

    const coverageRate = totalLessonsInClass > 0 && studentIds.length > 0
      ? Math.min(
          Math.round((completedLessons / (totalLessonsInClass * studentIds.length)) * 100),
          100
        )
      : 0;

    return {
      id: classroom.id,
      name: classroom.name,
      teacher: classroom.teacher,
      studentCount: studentIds.length,
      avgScore,
      coverageRate,
      totalAssignments: classroom.assignments.length,
      totalSubtopics: classroom.subjects
        .flatMap((s) => s.topics.flatMap((t) => t.subtopics))
        .length,
    };
  });

  // Teacher activity — lean query
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true,
      name: true,
      email: true,
      teachingClassrooms: {
        select: { id: true },
      },
    },
  });

  const recentLessonCounts = await prisma.lesson.groupBy({
    by: ["subtopicId"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
  });

  // Get subtopic → classroom mapping for teacher activity
  const subtopics = await prisma.subtopic.findMany({
    select: {
      id: true,
      topic: {
        select: {
          subject: {
            select: { classroomId: true },
          },
        },
      },
    },
  });

  const subtopicToClassroom = new Map(
    subtopics.map((s) => [s.id, s.topic.subject.classroomId])
  );

  const classroomLessonCount = new Map<string, number>();
  for (const group of recentLessonCounts) {
    const classroomId = subtopicToClassroom.get(group.subtopicId);
    if (classroomId) {
      classroomLessonCount.set(
        classroomId,
        (classroomLessonCount.get(classroomId) || 0) + group._count.id
      );
    }
  }

  const teacherActivity = teachers.map((teacher) => {
    const recentLessons = teacher.teachingClassrooms.reduce(
      (acc, c) => acc + (classroomLessonCount.get(c.id) || 0),
      0
    );
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      recentLessons,
      classCount: teacher.teachingClassrooms.length,
      active: recentLessons > 0,
    };
  });

  // Recent activity — parallel lean queries
  const [recentLessons, recentSubmissions, recentAnnouncements] = await Promise.all([
    prisma.lesson.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        subtopic: {
          select: {
            topic: {
              select: {
                subject: {
                  select: {
                    classroom: {
                      select: {
                        name: true,
                        teacher: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.assignmentSubmission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        student: { select: { name: true } },
        assignment: { select: { title: true } },
      },
    }),
    prisma.announcement.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
  ]);

  // At-risk count
  const atRiskCount = uniqueStudentIds.filter((studentId) => {
    const attempts = attemptsByUser.get(studentId) || [];
    const avgScore = attempts.length
      ? attempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) / attempts.length
      : 100;
    return avgScore < 50;
  }).length;

  const result = {
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
  };

  setCached(cacheKey, result, CACHE_TTL.SHORT);

  return NextResponse.json(result);
}