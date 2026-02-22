import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const alerts = await prisma.emergencyAlert.findMany({
    where: { active: true },
    include: {
      author: { select: { name: true } },
      acknowledgements: { where: { userId } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    alerts.map((a) => ({ ...a, isAcknowledged: a.acknowledgements.length > 0 }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can send emergency alerts" }, { status: 403 });
  }

  const authorId = (session.user as any).id;
  const { title, message, severity } = await req.json();

  if (!title || !message) {
    return NextResponse.json({ error: "title and message required" }, { status: 400 });
  }

  const alert = await prisma.emergencyAlert.create({
    data: { title, message, severity: severity || "HIGH", authorId },
  });

  // Notify all users
  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      message: `🚨 EMERGENCY: ${title}`,
    })),
  });

  return NextResponse.json(alert, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const { alertId, acknowledge, active } = await req.json();

  if (acknowledge) {
    await prisma.alertAcknowledgement.upsert({
      where: { alertId_userId: { alertId, userId } },
      update: {},
      create: { alertId, userId },
    });
    return NextResponse.json({ message: "Acknowledged" });
  }

  if (active !== undefined && role === "ADMIN") {
    await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: { active },
    });
    return NextResponse.json({ message: "Alert updated" });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}