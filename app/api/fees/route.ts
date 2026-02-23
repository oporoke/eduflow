import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");

  if (role === "ADMIN") {
    const fees = await prisma.feeStructure.findMany({
      where: classroomId ? { classroomId } : {},
      include: {
        classroom: true,
        feeItems: true,
        feePayments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(fees);
  }

  // Student/Parent view — get fees for their classrooms
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    select: { classroomId: true },
  });
  const classroomIds = enrollments.map((e) => e.classroomId);

  const fees = await prisma.feeStructure.findMany({
    where: { classroomId: { in: classroomIds } },
    include: {
      classroom: true,
      feeItems: true,
      feePayments: {
        where: { studentId: userId },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(fees);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classroomId, term, academicYear, totalAmount, description, dueDate, items } = await req.json();

  if (!classroomId || !term || !academicYear || !totalAmount) {
    return NextResponse.json({ error: "classroomId, term, academicYear and totalAmount required" }, { status: 400 });
  }

  const feeStructure = await prisma.feeStructure.create({
    data: {
      classroomId,
      term,
      academicYear,
      totalAmount: parseFloat(totalAmount),
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      feeItems: {
        create: (items || []).map((item: any) => ({
          name: item.name,
          amount: parseFloat(item.amount),
        })),
      },
    },
    include: { feeItems: true },
  });

  return NextResponse.json(feeStructure, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.feeStructure.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}