import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  const terms = await prisma.schoolTerm.findMany({
    where: { classroomId },
    include: {
      weekPlans: {
        include: {
          subject: true,
          topic: true,
        },
        orderBy: { weekNumber: "asc" },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(terms);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, startDate, endDate, classroomId } = await req.json();

  if (!name || !startDate || !endDate || !classroomId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const term = await prisma.schoolTerm.create({
    data: { name, startDate: new Date(startDate), endDate: new Date(endDate), classroomId },
  });

  return NextResponse.json(term, { status: 201 });
}