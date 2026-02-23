import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

async function generateLearningPath(studentId: string, classroomId: string) {
  // Get all subtopics in this classroom
  const subtopics = await prisma.subtopic.findMany({
    where: { topic: { subject: { classroomId } } },
    include: {
      topic: { include: { subject: true } },
      lessons: true,
      quizzes: true,
    },
  });

  // Get student's quiz performance per subtopic
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      studentId: studentId,
      quiz: { subtopicId: { in: subtopics.map((s) => s.id) } },
    },
    include: { quiz: true },
    orderBy: { createdAt: "desc" },
  });

  // Get lesson completion
  const completedLessons = await prisma.lessonProgress.findMany({
    where: { studentId: studentId, completed: true },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(completedLessons.map((l) => l.lessonId));

  // Analyze each subtopic
  const items: any[] = [];

  for (const subtopic of subtopics) {
    const attempts = quizAttempts.filter((a) => a.quiz.subtopicId === subtopic.id);
    const latestAttempt = attempts[0];
    const avgScore = attempts.length
      ? attempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) / attempts.length
      : null;

    // Check lesson completion for this subtopic
    const subtopicLessons = subtopic.lessons;
    const completedCount = subtopicLessons.filter((l) => completedLessonIds.has(l.id)).length;
    const completionRate = subtopicLessons.length
      ? (completedCount / subtopicLessons.length) * 100
      : 100;

    // Generate path items based on performance
    if (avgScore !== null && avgScore < 50) {
      // Struggling — revisit lessons
      items.push({
        type: "REVISIT",
        title: `Revisit: ${subtopic.name}`,
        description: `Your quiz score was ${Math.round(avgScore)}% — let's go back and strengthen this topic`,
        subtopicId: subtopic.id,
        priority: 1,
      });
    } else if (avgScore !== null && avgScore < 75) {
      // Needs practice
      if (subtopic.quizzes.length > 0) {
        items.push({
          type: "PRACTICE",
          title: `Practice: ${subtopic.name}`,
          description: `You scored ${Math.round(avgScore)}% — try the quiz again to reinforce your understanding`,
          subtopicId: subtopic.id,
          quizId: subtopic.quizzes[0].id,
          priority: 2,
        });
      }
    } else if (avgScore !== null && avgScore >= 75) {
      // Ready to advance
      const currentIndex = subtopics.indexOf(subtopic);
      const nextSubtopic = subtopics[currentIndex + 1];
      if (nextSubtopic) {
        items.push({
          type: "ADVANCE",
          title: `Ready for: ${nextSubtopic.name}`,
          description: `Excellent work on ${subtopic.name}! You're ready to move forward`,
          subtopicId: nextSubtopic.id,
          priority: 3,
        });
      }
    } else if (completionRate < 50 && subtopicLessons.length > 0) {
      // Hasn't started lessons yet
      items.push({
        type: "START",
        title: `Start: ${subtopic.name}`,
        description: `You haven't completed the lessons for this topic yet`,
        subtopicId: subtopic.id,
        lessonId: subtopicLessons.find((l) => !completedLessonIds.has(l.id))?.id,
        priority: 2,
      });
    }
  }

  // Sort by priority then by type
  items.sort((a, b) => a.priority - b.priority);

  // Upsert learning path
  const path = await prisma.learningPath.upsert({
    where: { studentId_classroomId: { studentId, classroomId } },
    update: { updatedAt: new Date() },
    create: { studentId, classroomId },
  });

  // Clear old items and recreate
  await prisma.learningPathItem.deleteMany({ where: { pathId: path.id } });

  if (items.length > 0) {
    await prisma.learningPathItem.createMany({
      data: items.map((item) => ({ ...item, pathId: path.id })),
    });
  }

  return prisma.learningPath.findUnique({
    where: { id: path.id },
    include: {
      items: { orderBy: { priority: "asc" } },
    },
  });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const studentId = searchParams.get("studentId") || userId;

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  // Regenerate path on each request to keep it current
  const path = await generateLearningPath(studentId, classroomId);

  return NextResponse.json(path);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();

  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const item = await prisma.learningPathItem.update({
    where: { id: itemId },
    data: { completed: true, completedAt: new Date() },
  });

  return NextResponse.json(item);
}