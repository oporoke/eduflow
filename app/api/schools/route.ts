import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const county = searchParams.get("county");

  const schools = await prisma.school.findMany({
    where: county ? { county } : {},
    include: {
      users: {
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      classrooms: {
        include: {
          classroom: {
            include: {
              enrollments: true,
              assignments: true,
              subjects: {
                include: {
                  topics: {
                    include: {
                      subtopics: {
                        include: { lessons: true, quizzes: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Compute stats per school
  const schoolsWithStats = await Promise.all(
    schools.map(async (school) => {
      const studentCount = school.users.filter((u) => u.user.role === "STUDENT").length;
      const teacherCount = school.users.filter((u) => u.user.role === "TEACHER").length;
      const classCount = school.classrooms.length;

      // Quiz performance
      const studentIds = school.users
        .filter((u) => u.user.role === "STUDENT")
        .map((u) => u.userId);

      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId: { in: studentIds } },
        select: { score: true, maxScore: true },
      });

      const avgScore = quizAttempts.length
        ? Math.round(
            quizAttempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) /
              quizAttempts.length
          )
        : 0;

      const totalLessons = school.classrooms.reduce(
        (acc, c) =>
          acc +
          c.classroom.subjects.reduce(
            (s, sub) =>
              s +
              sub.topics.reduce(
                (t, top) =>
                  t + top.subtopics.reduce((st, subtop) => st + subtop.lessons.length, 0),
                0
              ),
            0
          ),
        0
      );

      return {
        ...school,
        stats: {
          studentCount,
          teacherCount,
          classCount,
          avgScore,
          totalLessons,
        },
      };
    })
  );

  return NextResponse.json(schoolsWithStats);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, code, county, subCounty, address, phone, email, type } = await req.json();

  if (!name || !code || !county) {
    return NextResponse.json({ error: "name, code and county required" }, { status: 400 });
  }

  try {
    const school = await prisma.school.create({
      data: { name, code, county, subCounty, address, phone, email, type: type || "PRIMARY" },
    });
    return NextResponse.json(school, { status: 201 });
  } catch {
    return NextResponse.json({ error: "School code already exists" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { schoolId, userId, classroomId, action } = await req.json();

  if (action === "addUser" && schoolId && userId) {
    await prisma.schoolUser.upsert({
      where: { schoolId_userId: { schoolId, userId } },
      update: {},
      create: { schoolId, userId },
    });
    return NextResponse.json({ message: "User added to school" });
  }

  if (action === "addClassroom" && schoolId && classroomId) {
    await prisma.schoolClassroom.upsert({
      where: { schoolId_classroomId: { schoolId, classroomId } },
      update: {},
      create: { schoolId, classroomId },
    });
    return NextResponse.json({ message: "Classroom added to school" });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}