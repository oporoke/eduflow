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

  const staff = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      staffProfile: {
        include: {
          leaveApplications: { orderBy: { createdAt: "desc" }, take: 5 },
          performanceReviews: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(staff);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, staffNumber, department, designation, qualification, dateJoined, dateOfBirth, phone, address, emergencyContact } = await req.json();

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const profile = await prisma.staffProfile.upsert({
    where: { userId },
    update: { staffNumber, department, designation, qualification, dateJoined: dateJoined ? new Date(dateJoined) : null, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, phone, address, emergencyContact },
    create: { userId, staffNumber, department, designation, qualification, dateJoined: dateJoined ? new Date(dateJoined) : null, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, phone, address, emergencyContact },
  });

  return NextResponse.json(profile);
}