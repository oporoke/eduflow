import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role === "ADMIN") {
    const applications = await prisma.leaveApplication.findMany({
      include: {
        staff: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(applications);
  }

  const staffProfile = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!staffProfile) return NextResponse.json([]);

  const applications = await prisma.leaveApplication.findMany({
    where: { staffId: staffProfile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { type, startDate, endDate, reason } = await req.json();

  if (!type || !startDate || !endDate || !reason) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const staffProfile = await prisma.staffProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const application = await prisma.leaveApplication.create({
    data: { staffId: staffProfile.id, type, startDate: new Date(startDate), endDate: new Date(endDate), reason },
  });

  return NextResponse.json(application, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { applicationId, status, reviewNote } = await req.json();

  const application = await prisma.leaveApplication.update({
    where: { id: applicationId },
    data: { status, reviewNote },
  });

  return NextResponse.json(application);
}