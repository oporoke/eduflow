import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const subtopicId = searchParams.get("subtopicId");

  if (!subtopicId) return NextResponse.json({ error: "subtopicId required" }, { status: 400 });

  const progress = await prisma.lessonProgress.findMany({
    where: {
      studentId: userId,
      lesson: { subtopicId },
    },
  });

  return NextResponse.json(progress);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { lessonId, completed } = await req.json();

  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: userId, lessonId } },
    update: { completed },
    create: { studentId: userId, lessonId, completed },
  });

  return NextResponse.json(progress);
}