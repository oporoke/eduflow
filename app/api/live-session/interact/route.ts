import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { sessionId, type, emoji, vote, question } = await req.json();

  if (type === "reaction") {
    const reaction = await prisma.reaction.create({
      data: { sessionId, studentId: userId, emoji },
    });
    return NextResponse.json(reaction, { status: 201 });
  }

  if (type === "pace") {
    const paceVote = await prisma.paceVote.upsert({
      where: { studentId_sessionId: { studentId: userId, sessionId } },
      update: { vote },
      create: { sessionId, studentId: userId, vote },
    });
    return NextResponse.json(paceVote, { status: 201 });
  }

  if (type === "question") {
    const liveQuestion = await prisma.liveQuestion.create({
      data: { sessionId, studentId: userId, text: question },
    });
    return NextResponse.json(liveQuestion, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId } = await req.json();

  const question = await prisma.liveQuestion.update({
    where: { id: questionId },
    data: { answered: true },
  });

  return NextResponse.json(question);
}