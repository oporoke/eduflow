import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const borrowings = await prisma.bookBorrowing.findMany({
    where: role === "ADMIN" ? {} : { borrowerId: userId },
    include: {
      book: true,
      borrower: { select: { name: true, email: true } },
    },
    orderBy: { borrowedAt: "desc" },
  });

  return NextResponse.json(borrowings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can issue books" }, { status: 403 });
  }

  const { bookId, borrowerId, dueDate } = await req.json();

  if (!bookId || !borrowerId || !dueDate) {
    return NextResponse.json({ error: "bookId, borrowerId and dueDate required" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.availableCopies < 1) {
    return NextResponse.json({ error: "Book not available" }, { status: 400 });
  }

  const [borrowing] = await prisma.$transaction([
    prisma.bookBorrowing.create({
      data: { bookId, borrowerId, dueDate: new Date(dueDate), status: "BORROWED" },
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json(borrowing, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can process returns" }, { status: 403 });
  }

  const { borrowingId } = await req.json();

  if (!borrowingId) return NextResponse.json({ error: "borrowingId required" }, { status: 400 });

  const borrowing = await prisma.bookBorrowing.findUnique({ where: { id: borrowingId } });
  if (!borrowing) return NextResponse.json({ error: "Borrowing not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.bookBorrowing.update({
      where: { id: borrowingId },
      data: { status: "RETURNED", returnedAt: new Date() },
    }),
    prisma.book.update({
      where: { id: borrowing.bookId },
      data: { availableCopies: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ message: "Book returned successfully" });
}