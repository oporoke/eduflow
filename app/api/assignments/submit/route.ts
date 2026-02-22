import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { assignmentId, content, fileUrl } = await req.json();

  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
  }

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: userId } },
    update: { content, fileUrl, status: "SUBMITTED", submittedAt: new Date() },
    create: { assignmentId, studentId: userId, content, fileUrl, status: "SUBMITTED" },
  });

  return NextResponse.json(submission, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId, marks, feedback } = await req.json();

  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { marks, feedback, status: "GRADED" },
  });

  return NextResponse.json(submission);
}