import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || (session.user as any).id;

  const portfolio = await prisma.portfolio.findUnique({
    where: { studentId },
    include: {
      items: { orderBy: { createdAt: "desc" } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(portfolio);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { bio } = await req.json();

  const portfolio = await prisma.portfolio.upsert({
    where: { studentId: userId },
    update: { bio },
    create: { studentId: userId, bio },
  });

  return NextResponse.json(portfolio);
}