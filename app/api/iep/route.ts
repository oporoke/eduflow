import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const studentId = searchParams.get("studentId");

  const ieps = await prisma.iEP.findMany({
    where: {
      ...(classroomId && { classroomId }),
      ...(studentId && { studentId }),
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      teacher: { select: { id: true, name: true } },
      reviews: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(ieps);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacherId = (session.user as any).id;
  const { studentId, classroomId, strengths, areasOfConcern, learningGoals, interventions, reviewDate } = await req.json();

  if (!studentId || !classroomId) {
    return NextResponse.json({ error: "studentId and classroomId required" }, { status: 400 });
  }

  const iep = await prisma.iEP.create({
    data: {
      studentId,
      classroomId,
      teacherId,
      strengths,
      areasOfConcern,
      learningGoals,
      interventions,
      reviewDate: reviewDate ? new Date(reviewDate) : null,
      status: "DRAFT",
    },
  });

  return NextResponse.json(iep, { status: 201 });
}