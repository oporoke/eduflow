import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        message: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: skip + limit < total,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await req.json();

  await prisma.notification.updateMany({
    where: id ? { id, userId } : { userId },
    data: { read: true },
  });

  return NextResponse.json({ message: "Marked as read" });
}