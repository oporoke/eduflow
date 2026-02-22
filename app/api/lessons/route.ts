import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyEnrolledStudents } from "@/lib/notify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subtopicId = searchParams.get("subtopicId");

  if (!subtopicId) return NextResponse.json({ error: "subtopicId required" }, { status: 400 });

  const lessons = await prisma.lesson.findMany({
    where: { subtopicId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(lessons);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, contentType, text, imageUrl, videoUrl, subtopicId } = await req.json();

  if (!title || !contentType || !subtopicId) {
    return NextResponse.json({ error: "title, contentType and subtopicId are required" }, { status: 400 });
  }

  const lesson = await prisma.lesson.create({
    data: { title, contentType, text, imageUrl, videoUrl, subtopicId },
  });

  // Find classroom via subtopic → topic → subject → classroom
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: { topic: { include: { subject: true } } },
  });

  if (subtopic) {
    await notifyEnrolledStudents(
      subtopic.topic.subject.classroomId,
      `New lesson added: "${title}"`
    );
  }

  return NextResponse.json(lesson, { status: 201 });
}
