import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviewerId = (session.user as any).id;
  const { staffId, period, rating, comments, goals } = await req.json();

  if (!staffId || !period || !rating) {
    return NextResponse.json({ error: "staffId, period and rating required" }, { status: 400 });
  }

  const review = await prisma.performanceReview.create({
    data: { staffId, reviewerId, period, rating, comments, goals },
  });

  return NextResponse.json(review, { status: 201 });
}