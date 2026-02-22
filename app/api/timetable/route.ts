import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  const timetable = await prisma.timetable.findUnique({
    where: { classroomId },
    include: {
      slots: {
        include: {
          subject: true,
          teacher: { select: { id: true, name: true } },
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
    },
  });

  return NextResponse.json(timetable);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classroomId, day, startTime, endTime, subjectId, teacherId, room } = await req.json();

  if (!classroomId || !day || !startTime || !endTime || !subjectId || !teacherId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  // Ensure timetable exists
  const timetable = await prisma.timetable.upsert({
    where: { classroomId },
    update: {},
    create: { classroomId },
  });

  try {
    const slot = await prisma.timetableSlot.create({
      data: { timetableId: timetable.id, day, startTime, endTime, subjectId, teacherId, room },
      include: {
        subject: true,
        teacher: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(slot, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A slot already exists at this time" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.timetableSlot.delete({ where: { id } });

  return NextResponse.json({ message: "Slot deleted" });
}