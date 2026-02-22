import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getParentSession } from "@/lib/parent-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Check both teacher/admin session and parent session
  const session = await auth();
  const parentSession = await getParentSession();

  if (!session && !parentSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = session
    ? await prisma.pTMeeting.findMany({
        where: {
          OR: [
            { teacherId: (session.user as any).id },
            { studentId: (session.user as any).id },
          ],
        },
        include: {
          teacher: { select: { name: true } },
          parent: { select: { name: true, email: true } },
          student: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      })
    : await prisma.pTMeeting.findMany({
        where: { parentId: parentSession!.id },
        include: {
          teacher: { select: { name: true } },
          parent: { select: { name: true, email: true } },
          student: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      });

  return NextResponse.json(meetings);
}

export async function POST(req: Request) {
  const session = await auth();
  const parentSession = await getParentSession();

  if (!session && !parentSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherId, parentId, studentId, date, duration, venue, agenda } = await req.json();

  if (!teacherId || !parentId || !studentId || !date) {
    return NextResponse.json({ error: "teacherId, parentId, studentId and date required" }, { status: 400 });
  }

  const meeting = await prisma.pTMeeting.create({
    data: {
      teacherId,
      parentId,
      studentId,
      date: new Date(date),
      duration: duration || 30,
      venue,
      agenda,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  const parentSession = await getParentSession();

  if (!session && !parentSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId, status, notes, date, venue, agenda } = await req.json();

  const meeting = await prisma.pTMeeting.update({
    where: { id: meetingId },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(date && { date: new Date(date) }),
      ...(venue !== undefined && { venue }),
      ...(agenda !== undefined && { agenda }),
    },
  });

  return NextResponse.json(meeting);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.pTMeeting.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}