import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  let userIds: string[] = [];

  if (classroomId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classroomId },
    });
    userIds = enrollments.map((e) => e.studentId);
  }

  const leaderboard = await prisma.userPoints.findMany({
    where: classroomId ? { userId: { in: userIds } } : {},
    orderBy: { points: "desc" },
    take: 10,
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(leaderboard);
}