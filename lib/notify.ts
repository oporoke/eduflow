import { prisma } from "@/lib/prisma";

export async function notifyUser(userId: string, message: string) {
  await prisma.notification.create({
    data: { userId, message },
  });
}

export async function notifyEnrolledStudents(classroomId: string, message: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { classroomId },
  });

  await prisma.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.studentId,
      message,
    })),
  });
}