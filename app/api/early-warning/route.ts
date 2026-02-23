import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

  // Quiz performance (weight: 35%)
  if (data.quizAvg < 30) { score += 35; signals.push("Very low quiz scores (below 30%)"); }
  else if (data.quizAvg < 50) { score += 25; signals.push("Low quiz scores (below 50%)"); }
  else if (data.quizAvg < 65) { score += 10; signals.push("Below average quiz scores"); }

  // Assignment submission rate (weight: 30%)
  if (data.submissionRate < 30) { score += 30; signals.push("Very low assignment submission rate (below 30%)"); }
  else if (data.submissionRate < 60) { score += 20; signals.push("Low assignment submission rate (below 60%)"); }
  else if (data.submissionRate < 80) { score += 8; signals.push("Some missing assignments"); }

  // Lesson completion (weight: 20%)
  if (data.lessonCompletionRate < 20) { score += 20; signals.push("Very low lesson completion (below 20%)"); }
  else if (data.lessonCompletionRate < 40) { score += 14; signals.push("Low lesson completion (below 40%)"); }
  else if (data.lessonCompletionRate < 60) { score += 6; signals.push("Below average lesson completion"); }

  // Streak / engagement (weight: 10%)
  if (data.streak === 0) { score += 10; signals.push("No learning streak — disengaged for 7+ days"); }
  else if (data.streak < 3) { score += 5; signals.push("Low learning streak"); }

  // Pace votes (weight: 5%)
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

  // Get students to analyze
  let students: any[] = [];

  if (role === "ADMIN") {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        classrooms: { include: { classroom: true } },
      },
    });
  } else if (role === "TEACHER") {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: userId },
      include: {
        enrollments: {
          include: {
            user: {
              include: { classrooms: { include: { classroom: true } } },
            },
          },
        },
      },
    });
    students = classrooms.flatMap((c) => c.enrollments.map((e) => e.user));
    students = [...new Map(students.map((s) => [s.id, s])).values()];
  }

  if (classroomId) {
    const enrollment = await prisma.classEnrollment.findMany({
      where: { classroomId },
      select: { userId: true },
    });
    const ids = enrollment.map((e) => e.userId);
    students = students.filter((s) => ids.includes(s.id));
  }

  // Analyze each student
  const results = await Promise.all(
    students.map(async (student) => {
      // Quiz performance
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId: student.id },
        select: { score: true, maxScore: true },
      });
      const quizAvg = quizAttempts.length
        ? (quizAttempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) / quizAttempts.length)
        : 100;

      // Assignment submission rate
      const classroomIds = student.classrooms?.map((c: any) => c.classroomId) || [];
      const totalAssignments = await prisma.assignment.count({
        where: { classroomId: { in: classroomIds } },
      });
      const submitted = await prisma.assignmentSubmission.count({
        where: { studentId: student.id },
      });
      const submissionRate = totalAssignments > 0 ? (submitted / totalAssignments) * 100 : 100;

      // Lesson completion
      const totalLessons = await prisma.lesson.count({
        where: { subtopic: { topic: { subject: { classroomId: { in: classroomIds } } } } },
      });
      const completedLessons = await prisma.lessonProgress.count({
        where: { userId: student.id, completed: true },
      });
      const lessonCompletionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 100;

      // Streak
      const gameData = await prisma.gamification.findUnique({
        where: { userId: student.id },
      });
      const streak = gameData?.streak || 0;

      // Pace votes
      const lostVotes = await prisma.paceVote.count({
        where: { userId: student.id, vote: "LOST" },
      });
      const totalVotes = await prisma.paceVote.count({
        where: { userId: student.id },
      });

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
    })
  );

  // Sort by risk score descending
  results.sort((a, b) => b.score - a.score);

  // Auto-notify parents of HIGH risk students
  const highRisk = results.filter((r) => r.level === "HIGH");
  for (const risk of highRisk) {
    const parent = await prisma.parentStudent.findFirst({
      where: { studentId: risk.student.id },
      include: { parent: true },
    });
    if (parent) {
      // Check if already notified today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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
  }

  return NextResponse.json({
    total: results.length,
    highRisk: highRisk.length,
    atRisk: results.filter((r) => r.level === "AT_RISK").length,
    lowRisk: results.filter((r) => r.level === "LOW").length,
    students: results,
  });
}