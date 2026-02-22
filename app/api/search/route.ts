import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ classes: [], subjects: [], lessons: [] });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  // Search classes
  const classes = await prisma.classroom.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      ...(role === "STUDENT" && {
        enrollments: { some: { studentId: userId } },
      }),
      ...(role === "TEACHER" && { teacherId: userId }),
    },
    include: { teacher: true },
    take: 5,
  });

  // Search subjects
  const subjects = await prisma.subject.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    include: { classroom: true },
    take: 5,
  });

  // Search lessons
  const lessons = await prisma.lesson.findMany({
    where: {
      title: { contains: query, mode: "insensitive" },
    },
    include: {
      subtopic: {
        include: {
          topic: {
            include: {
              subject: {
                include: { classroom: true },
              },
            },
          },
        },
      },
    },
    take: 5,
  });

  return NextResponse.json({ classes, subjects, lessons });
}