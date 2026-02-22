import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { termId, weekNumber, subjectId, topicId, notes } = await req.json();

  if (!termId || !weekNumber || !subjectId || !topicId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const plan = await prisma.weekPlan.create({
    data: { termId, weekNumber, subjectId, topicId, notes },
    include: { subject: true, topic: true },
  });

  return NextResponse.json(plan, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, completed, notes } = await req.json();

  const plan = await prisma.weekPlan.update({
    where: { id },
    data: {
      ...(completed !== undefined && { completed }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json(plan);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.weekPlan.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}