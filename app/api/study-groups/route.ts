import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  const groups = await prisma.studyGroup.findMany({
    where: { classroomId },
    include: {
      createdBy: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
      posts: {
        include: {
          author: { select: { id: true, name: true } },
          upvotedBy: true,
          replies: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    groups.map((g) => ({
      ...g,
      isMember: g.members.some((m) => m.userId === userId),
      memberCount: g.members.length,
      postCount: g.posts.length,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name, description, classroomId, subjectId } = await req.json();

  if (!name || !classroomId) {
    return NextResponse.json({ error: "name and classroomId required" }, { status: 400 });
  }

  const group = await prisma.studyGroup.create({
    data: {
      name,
      description,
      classroomId,
      subjectId,
      createdById: userId,
      members: {
        create: { userId, role: "ADMIN" },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}