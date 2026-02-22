import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const email = session.user!.email!;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let classes;

    if (role === "ADMIN") {
      classes = await prisma.classroom.findMany({ include: { teacher: true, enrollments: true } });
    } else if (role === "TEACHER") {
      classes = await prisma.classroom.findMany({
        where: { teacherId: user.id },
        include: { teacher: true, enrollments: true },
      });
    } else {
      classes = await prisma.classroom.findMany({
        where: { enrollments: { some: { studentId: user.id } } },
        include: { teacher: true, enrollments: true },
      });
    }

    return NextResponse.json(classes);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, description, teacherId } = await req.json();

    if (!name || !teacherId) {
      return NextResponse.json({ error: "Name and teacher are required" }, { status: 400 });
    }

    const newClass = await prisma.classroom.create({
      data: { name, description, teacherId },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
