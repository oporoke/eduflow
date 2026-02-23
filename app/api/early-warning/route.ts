import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getCached, setCached, CACHE_TTL } from "@/lib/cache";

function calculateRiskScore(data: {
  quizAvg: number;
  submissionRate: number;
  lessonCompletionRate: number;
  streak: number;
  lostVotes: number;
  totalVotes: number;
}): { score: number; level: string; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  if (data.quizAvg < 30) { score += 35; signals.push("Very low quiz scores (below 30%)"); }
  else if (data.quizAvg < 50) { score += 25; signals.push("Low quiz scores (below 50%)"); }
  else if (data.quizAvg < 65) { score += 10; signals.push("Below average quiz scores"); }

  if (data.submissionRate < 30) { score += 30; signals.push("Very low assignment submission rate (below 30%)"); }
  else if (data.submissionRate < 60) { score += 20; signals.push("Low assignment submission rate (below 60%)"); }
  else if (data.submissionRate < 80) { score += 8; signals.push("Some missing assignments"); }

  if (data.lessonCompletionRate < 20) { score += 20; signals.push("Very low lesson completion (below 20%)"); }
  else if (data.lessonCompletionRate < 40) { score += 14; signals.push("Low lesson completion (below 40%)"); }
  else if (data.lessonCompletionRate < 60) { score += 6; signals.push("Below average lesson completion"); }

  if (data.streak === 0) { score += 10; signals.push("No learning streak — disengaged for 7+ days"); }
  else if (data.streak < 3) { score += 5; signals.push("Low learning streak"); }

  if (data.totalVotes > 0) {
    const lostRate = data.lostVotes / data.totalVotes;
    if (lostRate > 0.5) { score += 5; signals.push("Frequently indicates feeling lost in lessons"); }
  }

  const level = score >= 70 ? "HIGH" : score >= 40 ? "AT_RISK" : "LOW";
  return { score: Math.min(score, 100), level, signals };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  const cacheKey = `early-warning-${role}-${userId}-${classroomId || "all"}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Get students based on role
  let studentIds: string[] = [];
  let studentsMap = new Map<string, { id: string; name: string; email: string }>();

  if (role === "ADMIN") {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true },
    });
    students.forEach((s) => studentsMap.set(s.id, s));
    studentIds = students.map((s) => s.id);
  } else if (role === "TEACHER") {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: userId },
      include: { enrollments: { select: { userId: true } } },
    });
    const ids = [...new Set(classrooms.flatMap((c) => c.enrollments.map((e) => e.userId)))];
    const students = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    });
    students.forEach((s) => studentsMap.set(s.id, s));
    studentIds = ids;
  }

  // Filter by classroom if provided
  if (classroomId) {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classroomId },
      select: { userId: true },
    });
    const classroomStudentIds = new Set(enrollments.map((e) => e.userId));
    studentIds = studentIds.filter((id) => classroomStudentIds.has(id));
  }

  if (studentIds.length === 0) {
    return NextResponse.json({ total: 0, highRisk: 0, atRisk: 0, lowRisk: 0, students: [] });
  }

  // Bulk fetch all data at once
  const [
    allAttempts,
    allSubmissions,
    allAssignments,
    allLessonProgress,
    allLessons,
    allGameData,
    allLostVotes,
    allTotalVotes,
    allEnrollments,
  ] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, score: true, maxScore: true },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true },
    }),
    prisma.assignment.findMany({
      select: { classroomId: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: { in: studentIds }, completed: true },
      select: { userId: true },
    }),
    prisma.lesson.count(),
    prisma.gamification.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, streak: true },
    }),
    prisma.paceVote.groupBy({
      by: ["userId"],
      where: { userId: { in: studentIds }, vote: "LOST" },
      _count: { id: true },
    }),
    prisma.paceVote.groupBy({
      by: ["userId"],
      where: { userId: { in: studentIds } },
      _count: { id: true },
    }),
    prisma.classEnrollment.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, classroomId: true },
    }),
  ]);

  // Build lookup maps
  const attemptsByUser = new Map<string, { score: number; maxScore: number }[]>();
  for (const a of allAttempts) {
    if (!attemptsByUser.has(a.userId)) attemptsByUser.set(a.userId, []);
    attemptsByUser.get(a.userId)!.push(a);
  }

  const submissionsByStudent = new Map<string, number>();
  for (const s of allSubmissions) {
    submissionsByStudent.set(s.studentId, (submissionsByStudent.get(s.studentId) || 0) + 1);
  }

  const enrollmentsByUser = new Map<string, string[]>();
  for (const e of allEnrollments) {
    if (!enrollmentsByUser.has(e.userId)) enrollmentsByUser.set(e.userId, []);
    enrollmentsByUser.get(e.userId)!.push(e.classroomId);
  }

  const assignmentsByClassroom = new Map<string, number>();
  for (const a of allAssignments) {
    assignmentsByClassroom.set(a.classroomId, (assignmentsByClassroom.get(a.classroomId) || 0) + 1);
  }

  const progressByUser = new Map<string, number>();
  for (const p of allLessonProgress) {
    progressByUser.set(p.userId, (progressByUser.get(p.userId) || 0) + 1);
  }

  const gameByUser = new Map<string, number>();
  for (const g of allGameData) {
    gameByUser.set(g.userId, g.streak);
  }

  const lostVotesByUser = new Map<string, number>();
  for (const v of allLostVotes) {
    lostVotesByUser.set(v.userId, v._count.id);
  }

  const totalVotesByUser = new Map<string, number>();
  for (const v of allTotalVotes) {
    totalVotesByUser.set(v.userId, v._count.id);
  }

  // Calculate risk for each student
  const results = studentIds.map((studentId) => {
    const student = studentsMap.get(studentId)!;
    const attempts = attemptsByUser.get(studentId) || [];
    const quizAvg = attempts.length
      ? attempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) / attempts.length
      : 100;

    const classroomIds = enrollmentsByUser.get(studentId) || [];
    const totalAssignments = classroomIds.reduce(
      (acc, cid) => acc + (assignmentsByClassroom.get(cid) || 0), 0
    );
    const submitted = submissionsByStudent.get(studentId) || 0;
    const submissionRate = totalAssignments > 0 ? (submitted / totalAssignments) * 100 : 100;

    const completedLessons = progressByUser.get(studentId) || 0;
    const lessonCompletionRate = allLessons > 0 ? (completedLessons / allLessons) * 100 : 100;

    const streak = gameByUser.get(studentId) || 0;
    const lostVotes = lostVotesByUser.get(studentId) || 0;
    const totalVotes = totalVotesByUser.get(studentId) || 0;

    const { score, level, signals } = calculateRiskScore({
      quizAvg,
      submissionRate,
      lessonCompletionRate,
      streak,
      lostVotes,
      totalVotes,
    });

    return {
      student: { id: student.id, name: student.name, email: student.email },
      score,
      level,
      signals,
      metrics: {
        quizAvg: Math.round(quizAvg),
        submissionRate: Math.round(submissionRate),
        lessonCompletionRate: Math.round(lessonCompletionRate),
        streak,
        lostVotes,
        totalVotes,
      },
    };
  });

  results.sort((a, b) => b.score - a.score);

  // Auto-notify HIGH risk students (batch)
  const highRisk = results.filter((r) => r.level === "HIGH");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const risk of highRisk) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: risk.student.id,
        message: { contains: "Early Warning" },
        createdAt: { gte: today },
      },
    });
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: risk.student.id,
          message: `🚨 Early Warning: ${risk.student.name} is at HIGH risk. Signals: ${risk.signals[0]}`,
        },
      });
    }
  }

  const result = {
    total: results.length,
    highRisk: highRisk.length,
    atRisk: results.filter((r) => r.level === "AT_RISK").length,
    lowRisk: results.filter((r) => r.level === "LOW").length,
    students: results,
  };

  setCached(cacheKey, result, CACHE_TTL.SHORT);

  return NextResponse.json(result);
}