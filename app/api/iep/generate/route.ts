import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const classroomId = searchParams.get("classroomId");

  if (!studentId || !classroomId) {
    return NextResponse.json({ error: "studentId and classroomId required" }, { status: 400 });
  }

  // Get all lessons in classroom
  const subjects = await prisma.subject.findMany({
    where: { classroomId },
    include: {
      topics: {
        include: {
          subtopics: {
            include: {
              lessons: true,
              quizzes: { include: { attempts: { where: { studentId } } } },
            },
          },
        },
      },
    },
  });

  const allLessons = subjects.flatMap((s) =>
    s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.lessons))
  );

  const allQuizAttempts = subjects.flatMap((s) =>
    s.topics.flatMap((t) =>
      t.subtopics.flatMap((st) =>
        st.quizzes.flatMap((q) => q.attempts)
      )
    )
  );

  // Lesson completion
  const completedLessons = await prisma.lessonProgress.count({
    where: {
      studentId,
      lessonId: { in: allLessons.map((l) => l.id) },
      completed: true,
    },
  });

  const lessonCompletionRate = allLessons.length
    ? Math.round((completedLessons / allLessons.length) * 100)
    : 0;

  // Quiz performance
  const avgScore = allQuizAttempts.length
    ? Math.round(
        (allQuizAttempts.reduce((acc, a) => acc + a.score / a.total, 0) /
          allQuizAttempts.length) *
          100
      )
    : null;

  // Pace votes
  const paceVotes = await prisma.paceVote.findMany({
    where: { studentId },
  });

  const lostCount = paceVotes.filter((v) => v.vote === "Lost").length;
  const tooFastCount = paceVotes.filter((v) => v.vote === "Too Fast").length;

  // Generate suggestions
  const strengths: string[] = [];
  const areasOfConcern: string[] = [];
  const learningGoals: string[] = [];
  const interventions: string[] = [];

  // Lesson completion analysis
  if (lessonCompletionRate >= 80) {
    strengths.push(`Consistently completes lessons (${lessonCompletionRate}% completion rate)`);
  } else if (lessonCompletionRate >= 50) {
    areasOfConcern.push(`Moderate lesson engagement (${lessonCompletionRate}% completion rate)`);
    learningGoals.push("Improve lesson completion rate to at least 80%");
    interventions.push("Set weekly lesson completion targets and check in regularly");
  } else {
    areasOfConcern.push(`Low lesson engagement (${lessonCompletionRate}% completion rate)`);
    learningGoals.push("Complete at least 60% of assigned lessons per week");
    interventions.push("Schedule one-on-one check-ins to identify barriers to lesson completion");
  }

  // Quiz performance analysis
  if (avgScore !== null) {
    if (avgScore >= 70) {
      strengths.push(`Strong quiz performance (average score: ${avgScore}%)`);
    } else if (avgScore >= 50) {
      areasOfConcern.push(`Below average quiz performance (average score: ${avgScore}%)`);
      learningGoals.push("Improve quiz scores to at least 70%");
      interventions.push("Provide additional practice exercises and review sessions");
    } else {
      areasOfConcern.push(`Significant difficulty with assessments (average score: ${avgScore}%)`);
      learningGoals.push("Build foundational understanding to achieve at least 50% on quizzes");
      interventions.push("Consider differentiated instruction and additional support resources");
    }
  }

  // Pace analysis
  if (lostCount > 2) {
    areasOfConcern.push(`Frequently reports being lost during live sessions (${lostCount} times)`);
    learningGoals.push("Build confidence in following class pace");
    interventions.push("Pair with a peer mentor and review recorded lessons after class");
  }

  if (tooFastCount > 2) {
    areasOfConcern.push(`Frequently finds lessons too fast (${tooFastCount} times)`);
    interventions.push("Provide lesson materials in advance to allow pre-reading");
  }

  if (strengths.length === 0) {
    strengths.push("Student is enrolled and participating in the learning process");
  }

  // Review date — 3 months from now
  const reviewDate = new Date();
  reviewDate.setMonth(reviewDate.getMonth() + 3);

  return NextResponse.json({
    strengths: strengths.join("\n"),
    areasOfConcern: areasOfConcern.join("\n"),
    learningGoals: learningGoals.join("\n"),
    interventions: interventions.join("\n"),
    reviewDate: reviewDate.toISOString().split("T")[0],
    stats: {
      lessonCompletionRate,
      avgScore,
      lostCount,
      tooFastCount,
      totalLessons: allLessons.length,
      completedLessons,
    },
  });
}