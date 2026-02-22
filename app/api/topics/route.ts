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

  const { name, subjectId } = await req.json();

  if (!name || !subjectId) {
    return NextResponse.json({ error: "Name and subjectId required" }, { status: 400 });
  }

  const topic = await prisma.topic.create({
    data: { name, subjectId },
  });

  return NextResponse.json(topic, { status: 201 });
}