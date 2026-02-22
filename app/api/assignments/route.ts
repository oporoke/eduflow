import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const assignments = await prisma.assignment.findMany({
    where: {
      ...(classroomId && { classroomId }),
      ...(role === "TEACHER" && { teacherId: userId }),
    },
    include: {
      teacher: { select: { name: true } },
      subtopic: true,
      submissions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacherId = (session.user as any).id;
  const { title, description, dueDate, totalMarks, classroomId, subtopicId } = await req.json();

  if (!title || !classroomId) {
    return NextResponse.json({ error: "title and classroomId required" }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      totalMarks: totalMarks || 100,
      classroomId,
      teacherId,
      subtopicId: subtopicId || null,
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}