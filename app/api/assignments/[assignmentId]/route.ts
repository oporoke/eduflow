import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      teacher: { select: { name: true } },
      subtopic: true,
      submissions: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(assignment);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assignmentId } = await params;

  await prisma.assignment.delete({ where: { id: assignmentId } });

  return NextResponse.json({ message: "Deleted" });
}