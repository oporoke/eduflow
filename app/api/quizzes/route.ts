import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { notifyEnrolledStudents } from "@/lib/notify";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subtopicId = searchParams.get("subtopicId");

  if (!subtopicId) return NextResponse.json({ error: "subtopicId required" }, { status: 400 });

  const quizzes = await prisma.quiz.findMany({
    where: { subtopicId },
    include: { questions: true, attempts: true },
  });

  return NextResponse.json(quizzes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, subtopicId, questions } = await req.json();

  if (!title || !subtopicId || !questions?.length) {
    return NextResponse.json({ error: "title, subtopicId and questions are required" }, { status: 400 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title,
      subtopicId,
      questions: {
        create: questions.map((q: any) => ({
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
        })),
      },
    },
    include: { questions: true },
  });

  // Find classroom via subtopic → topic → subject → classroom
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: { topic: { include: { subject: true } } },
  });

  if (subtopic) {
    await notifyEnrolledStudents(
      subtopic.topic.subject.classroomId,
      `New quiz added: "${title}"`
    );
  }

  return NextResponse.json(quiz, { status: 201 });
}