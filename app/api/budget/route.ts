import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const budgets = await prisma.budget.findMany({
    include: {
      items: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const createdById = (session.user as any).id;
  const { title, academicYear, totalAmount, items } = await req.json();

  if (!title || !academicYear || !totalAmount) {
    return NextResponse.json({ error: "title, academicYear and totalAmount required" }, { status: 400 });
  }

  const budget = await prisma.budget.create({
    data: {
      title, academicYear,
      totalAmount: parseFloat(totalAmount),
      createdById,
      items: {
        create: (items || []).map((item: any) => ({
          category: item.category,
          description: item.description,
          planned: parseFloat(item.planned),
          actual: parseFloat(item.actual || 0),
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(budget, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { budgetId, status, itemId, actual } = await req.json();

  if (itemId !== undefined && actual !== undefined) {
    await prisma.budgetItem.update({
      where: { id: itemId },
      data: { actual: parseFloat(actual) },
    });
    return NextResponse.json({ message: "Item updated" });
  }

  if (budgetId && status) {
    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: { status },
    });
    return NextResponse.json(budget);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  await prisma.budget.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}