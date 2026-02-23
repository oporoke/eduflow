import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where: { /* existing where clause */ },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip,
      include: {
        author: { select: { id: true, name: true } },
        reads: { where: { userId }, select: { id: true } },
      },
    }),
    prisma.announcement.count({ where: { /* existing where clause */ } }),
  ]);

  return NextResponse.json({ announcements, total, page, hasMore: skip + limit < total });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authorId = (session.user as any).id;
  const { title, body, audience, classroomId, pinned } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: { title, body, authorId, audience: audience || "ALL", classroomId, pinned: pinned || false },
  });

  return NextResponse.json(announcement, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { announcementId } = await req.json();

  await prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId, userId } },
    update: {},
    create: { announcementId, userId },
  });

  return NextResponse.json({ message: "Marked as read" });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.announcement.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}