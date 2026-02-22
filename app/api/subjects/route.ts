import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  const subjects = await prisma.subject.findMany({
    where: { classroomId },
    include: { topics: { include: { subtopics: true } } },
  });

  return NextResponse.json(subjects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, classroomId } = await req.json();

  if (!name || !classroomId) {
    return NextResponse.json({ error: "Name and classroomId required" }, { status: 400 });
  }

  const subject = await prisma.subject.create({
    data: { name, classroomId },
  });

  return NextResponse.json(subject, { status: 201 });
}
