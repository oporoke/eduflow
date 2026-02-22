import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filterRole = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: filterRole ? { role: filterRole as any } : {},
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(users);
}
