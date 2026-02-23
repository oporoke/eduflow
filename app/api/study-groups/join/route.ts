import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { groupId } = await req.json();

  try {
    await prisma.studyGroupMember.create({
      data: { groupId, userId },
    });
    return NextResponse.json({ message: "Joined group" });
  } catch {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

  await prisma.studyGroupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  return NextResponse.json({ message: "Left group" });
}