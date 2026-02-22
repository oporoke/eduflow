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

  const observations = await prisma.lessonObservation.findMany({
    where: {
      ...(classroomId && { classroomId }),
      ...(role === "TEACHER" && { teacherId: userId }),
    },
    include: {
      teacher: { select: { id: true, name: true } },
      observer: { select: { id: true, name: true } },
      ratings: true,
      comments: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(observations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can schedule observations" }, { status: 403 });
  }

  const observerId = (session.user as any).id;
  const { teacherId, classroomId, date, topic } = await req.json();

  if (!teacherId || !classroomId || !date || !topic) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const observation = await prisma.lessonObservation.create({
    data: { teacherId, observerId, classroomId, date: new Date(date), topic },
  });

  return NextResponse.json(observation, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { observationId, ratings, comments, status } = await req.json();

  if (!observationId) return NextResponse.json({ error: "observationId required" }, { status: 400 });

  // Save ratings
  if (ratings?.length) {
    for (const r of ratings) {
      await prisma.observationRating.upsert({
        where: { observationId_criteria: { observationId, criteria: r.criteria } },
        update: { rating: r.rating },
        create: { observationId, criteria: r.criteria, rating: r.rating },
      });
    }
  }

  // Save comments
  if (comments?.length) {
    await prisma.observationComment.deleteMany({ where: { observationId } });
    await prisma.observationComment.createMany({
      data: comments.map((c: any) => ({ observationId, type: c.type, comment: c.comment })),
    });
  }

  // Update status
  const observation = await prisma.lessonObservation.update({
    where: { id: observationId },
    data: { ...(status && { status }) },
    include: { ratings: true, comments: true },
  });

  return NextResponse.json(observation);
}