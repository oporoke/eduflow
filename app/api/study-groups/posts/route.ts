import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { groupId, content, fileUrl, type, postId, pinned } = await req.json();

  // Add reply
  if (type === "reply" && postId) {
    const reply = await prisma.studyGroupReply.create({
      data: { postId, authorId: userId, content },
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json(reply, { status: 201 });
  }

  // Toggle upvote
  if (type === "upvote" && postId) {
    const existing = await prisma.studyGroupUpvote.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.studyGroupUpvote.delete({ where: { postId_userId: { postId, userId } } });
      await prisma.studyGroupPost.update({ where: { id: postId }, data: { upvotes: { decrement: 1 } } });
      return NextResponse.json({ upvoted: false });
    } else {
      await prisma.studyGroupUpvote.create({ data: { postId, userId } });
      await prisma.studyGroupPost.update({ where: { id: postId }, data: { upvotes: { increment: 1 } } });
      return NextResponse.json({ upvoted: true });
    }
  }

  // Toggle pin (teacher/admin only)
  if (type === "pin" && postId) {
    const post = await prisma.studyGroupPost.findUnique({ where: { id: postId } });
    await prisma.studyGroupPost.update({ where: { id: postId }, data: { pinned: !post?.pinned } });
    return NextResponse.json({ message: "Toggled pin" });
  }

  // Create post
  if (!groupId || !content) {
    return NextResponse.json({ error: "groupId and content required" }, { status: 400 });
  }

  const post = await prisma.studyGroupPost.create({
    data: { groupId, authorId: userId, content, fileUrl },
    include: {
      author: { select: { id: true, name: true } },
      upvotedBy: true,
      replies: { include: { author: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.studyGroupPost.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}