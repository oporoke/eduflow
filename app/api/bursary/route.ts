import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role === "ADMIN") {
    const programs = await prisma.bursaryProgram.findMany({
      include: {
        applications: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(programs);
  }

  // Students see active programs and their applications
  const programs = await prisma.bursaryProgram.findMany({
    where: { active: true },
    include: {
      applications: { where: { studentId: userId } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const body = await req.json();

  // Admin creates program
  if (role === "ADMIN" && body.type === "program") {
    const { name, description, totalFunds, source, academicYear, deadline } = body;
    if (!name || !totalFunds || !source || !academicYear) {
      return NextResponse.json({ error: "name, totalFunds, source and academicYear required" }, { status: 400 });
    }
    const program = await prisma.bursaryProgram.create({
      data: { name, description, totalFunds: parseFloat(totalFunds), source, academicYear, deadline: deadline ? new Date(deadline) : null },
    });
    return NextResponse.json(program, { status: 201 });
  }

  // Student applies
  if (role === "STUDENT" && body.type === "application") {
    const { programId, amount, reason } = body;
    if (!programId || !amount || !reason) {
      return NextResponse.json({ error: "programId, amount and reason required" }, { status: 400 });
    }
    try {
      const application = await prisma.bursaryApplication.create({
        data: { programId, studentId: userId, amount: parseFloat(amount), reason },
      });
      return NextResponse.json(application, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Already applied to this program" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as any).id;
  const { applicationId, status, reviewNote } = await req.json();

  const application = await prisma.bursaryApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.bursaryApplication.update({
    where: { id: applicationId },
    data: { status, reviewNote, approvedBy: userId },
  });

  // Update used funds if approved
  if (status === "APPROVED") {
    await prisma.bursaryProgram.update({
      where: { id: application.programId },
      data: { usedFunds: { increment: application.amount } },
    });
  }

  return NextResponse.json({ message: "Application updated" });
}