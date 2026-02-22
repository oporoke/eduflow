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

  const { submissionId, scores } = await req.json();

  if (!submissionId || !scores?.length) {
    return NextResponse.json({ error: "submissionId and scores required" }, { status: 400 });
  }

  // Upsert each criteria score
  for (const s of scores) {
    await prisma.rubricScore.upsert({
      where: { criteriaId_submissionId: { criteriaId: s.criteriaId, submissionId } },
      update: { score: s.score, comment: s.comment },
      create: { criteriaId: s.criteriaId, submissionId, score: s.score, comment: s.comment },
    });
  }

  // Calculate total marks based on weighted scores
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { include: { rubric: { include: { criteria: true } } } },
      rubricScores: true,
    },
  });

  if (submission?.assignment?.rubric) {
    const totalWeight = submission.assignment.rubric.criteria.reduce((acc, c) => acc + c.weight, 0);
    const weightedScore = submission.rubricScores.reduce((acc, rs) => {
      const criteria = submission.assignment.rubric!.criteria.find((c) => c.id === rs.criteriaId);
      if (!criteria) return acc;
      return acc + (rs.score / criteria.maxScore) * criteria.weight;
    }, 0);

    const percentage = Math.round((weightedScore / totalWeight) * 100);
    const totalMarks = submission.assignment.totalMarks;
    const marks = Math.round((percentage / 100) * totalMarks);

    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { marks, status: "GRADED" },
    });
  }

  return NextResponse.json({ message: "Scores saved" });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

  const scores = await prisma.rubricScore.findMany({
    where: { submissionId },
    include: { criteria: true },
  });

  return NextResponse.json(scores);
}