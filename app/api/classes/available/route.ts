import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Get all classes with enrollment status for this student
  const classes = await prisma.classroom.findMany({
    include: {
      teacher: true,
      enrollments: true,
    },
  });

  const result = classes.map((c) => ({
    ...c,
    isEnrolled: c.enrollments.some((e) => e.studentId === userId),
  }));

  return NextResponse.json(result);
}
