import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classId } = await params;

  const classData = await prisma.classroom.findUnique({
    where: { id: classId },
    include: {
      teacher: true,
      enrollments: {
        include: { student: true },
      },
    },
  });

  if (!classData) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  return NextResponse.json(classData);
}
