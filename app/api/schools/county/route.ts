import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all unique counties
  const schools = await prisma.school.findMany({
    select: { county: true },
    distinct: ["county"],
  });

  const counties = schools.map((s) => s.county);
  return NextResponse.json(counties);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, county } = await req.json();
  const authorId = (session.user as any).id;

  if (!title || !body || !county) {
    return NextResponse.json({ error: "title, body and county required" }, { status: 400 });
  }

  const announcement = await prisma.countyAnnouncement.create({
    data: { title, body, county, authorId },
  });

  return NextResponse.json(announcement, { status: 201 });
}