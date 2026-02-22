import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || (session.user as any).id;

  const [userPoints, userBadges, allBadges] = await Promise.all([
    prisma.userPoints.findUnique({ where: { userId: studentId } }),
    prisma.userBadge.findMany({
      where: { userId: studentId },
      include: { badge: true },
    }),
    prisma.badge.findMany(),
  ]);

  return NextResponse.json({
    points: userPoints?.points || 0,
    streak: userPoints?.streak || 0,
    earnedBadges: userBadges.map((b) => b.badge),
    allBadges,
  });
}