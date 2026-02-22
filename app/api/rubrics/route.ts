import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  const rubrics = await prisma.rubric.findMany({
    where: { ...(classroomId && { classroomId }) },
    include: { criteria: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rubrics);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacherId = (session.user as any).id;
  const { title, description, classroomId, criteria } = await req.json();

  if (!title || !classroomId || !criteria?.length) {
    return NextResponse.json({ error: "title, classroomId and criteria required" }, { status: 400 });
  }

  const rubric = await prisma.rubric.create({
    data: {
      title,
      description,
      classroomId,
      teacherId,
      criteria: {
        create: criteria.map((c: any) => ({
          name: c.name,
          description: c.description,
          maxScore: c.maxScore || 4,
          weight: c.weight || 1,
        })),
      },
    },
    include: { criteria: true },
  });

  return NextResponse.json(rubric, { status: 201 });
}