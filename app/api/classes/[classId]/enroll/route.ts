import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classId } = await params;
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  let studentId = userId;

  // Admin can enroll any student
  if (role === "ADMIN") {
    const body = await req.json();
    if (body.studentId) studentId = body.studentId;
  }

  if (!studentId) return NextResponse.json({ error: "Student ID is required" }, { status: 400 });

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, classroomId: classId },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classId } = await params;
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  let studentId = userId;

  // Admin can unenroll any student
  if (role === "ADMIN") {
    const body = await req.json();
    if (body.studentId) studentId = body.studentId;
  }

  await prisma.enrollment.delete({
    where: {
      studentId_classroomId: {
        studentId,
        classroomId: classId,
      },
    },
  });

  return NextResponse.json({ message: "Unenrolled successfully" });
}
