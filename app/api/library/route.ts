import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const books = await prisma.book.findMany({
    where: {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
          { isbn: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category }),
    },
    include: {
      borrowings: {
        where: { status: "BORROWED" },
        include: { borrower: { select: { name: true } } },
      },
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(books);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, author, isbn, category, description, coverUrl, totalCopies, location } = await req.json();

  if (!title || !author || !category) {
    return NextResponse.json({ error: "title, author and category required" }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: {
      title, author, isbn, category, description, coverUrl,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      location,
    },
  });

  return NextResponse.json(book, { status: 201 });
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

  await prisma.book.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}