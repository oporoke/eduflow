import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classroomId, subtopicId } = await req.json();

  // End any existing active sessions for this classroom
  await prisma.liveSession.updateMany({
    where: { classroomId, active: true },
    data: { active: false },
  });

  const liveSession = await prisma.liveSession.create({
    data: { classroomId, subtopicId, currentLessonIndex: 0, active: true },
  });

  return NextResponse.json(liveSession, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  const liveSession = await prisma.liveSession.findFirst({
    where: { classroomId, active: true },
    include: {
      reactions: { orderBy: { createdAt: "desc" }, take: 20 },
      paceVotes: true,
      questions: { where: { answered: false }, orderBy: { createdAt: "asc" } ,
        include: { student: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(liveSession);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, currentLessonIndex, active } = await req.json();

  const liveSession = await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      ...(currentLessonIndex !== undefined && { currentLessonIndex }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(liveSession);
}