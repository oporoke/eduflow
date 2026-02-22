import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ iepId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { iepId } = await params;

  const iep = await prisma.iEP.findUnique({
    where: { id: iepId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      teacher: { select: { id: true, name: true } },
      reviews: true,
    },
  });

  if (!iep) return NextResponse.json({ error: "IEP not found" }, { status: 404 });

  return NextResponse.json(iep);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ iepId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { iepId } = await params;
  const { strengths, areasOfConcern, learningGoals, interventions, reviewDate, status, parentAcknowledged } = await req.json();

  const iep = await prisma.iEP.update({
    where: { id: iepId },
    data: {
      ...(strengths !== undefined && { strengths }),
      ...(areasOfConcern !== undefined && { areasOfConcern }),
      ...(learningGoals !== undefined && { learningGoals }),
      ...(interventions !== undefined && { interventions }),
      ...(reviewDate !== undefined && { reviewDate: new Date(reviewDate) }),
      ...(status !== undefined && { status }),
      ...(parentAcknowledged !== undefined && { parentAcknowledged }),
    },
  });

  return NextResponse.json(iep);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ iepId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { iepId } = await params;

  await prisma.iEP.delete({ where: { id: iepId } });

  return NextResponse.json({ message: "IEP deleted" });
}