import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { title, description, type, content, fileUrl } = await req.json();

  if (!title || !type) {
    return NextResponse.json({ error: "title and type required" }, { status: 400 });
  }

  // Ensure portfolio exists
  const portfolio = await prisma.portfolio.upsert({
    where: { studentId: userId },
    update: {},
    create: { studentId: userId },
  });

  const item = await prisma.portfolioItem.create({
    data: { portfolioId: portfolio.id, title, description, type, content, fileUrl },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("id");

  if (!itemId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.portfolioItem.delete({ where: { id: itemId } });

  return NextResponse.json({ message: "Item deleted" });
}