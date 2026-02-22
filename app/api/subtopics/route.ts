import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, topicId } = await req.json();

  if (!name || !topicId) {
    return NextResponse.json({ error: "Name and topicId required" }, { status: 400 });
  }

  const subtopic = await prisma.subtopic.create({
    data: { name, topicId },
  });

  return NextResponse.json(subtopic, { status: 201 });
}