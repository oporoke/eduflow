import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { quizId, answers } = await req.json();

  if (!quizId || !answers) {
    return NextResponse.json({ error: "quizId and answers are required" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  let score = 0;
  quiz.questions.forEach((q) => {
    if (answers[q.id] === q.correctAnswer) score++;
  });

  const attempt = await prisma.quizAttempt.upsert({
    where: { studentId_quizId: { studentId: userId, quizId } },
    update: { score, total: quiz.questions.length },
    create: { studentId: userId, quizId, score, total: quiz.questions.length },
  });

  return NextResponse.json({ ...attempt, questions: quiz.questions, answers });
}
