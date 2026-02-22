import { prisma } from "@/lib/prisma";

export async function awardPoints(userId: string, points: number) {
  await prisma.userPoints.upsert({
    where: { userId },
    update: { points: { increment: points } },
    create: { userId, points },
  });
}

export async function checkAndAwardBadges(userId: string) {
  const [
    completedLessons,
    quizAttempts,
    enrollments,
    userPoints,
    existingBadges,
    allBadges,
  ] = await Promise.all([
    prisma.lessonProgress.count({ where: { studentId, completed: true } }),
    prisma.quizAttempt.findMany({ where: { studentId: userId } }),
    prisma.enrollment.count({ where: { studentId: userId } }),
    prisma.userPoints.findUnique({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId } }),
    prisma.badge.findMany(),
  ]);

  const earnedConditions = existingBadges.map((b) => b.badgeId);
  const newBadges: string[] = [];

  const perfectQuizzes = quizAttempts.filter((a) => a.score === a.total).length;
  const highScoreQuizzes = quizAttempts.filter((a) => a.score / a.total >= 0.8).length;

  const conditionMet: { [key: string]: boolean } = {
    LESSON_1: completedLessons >= 1,
    LESSON_5: completedLessons >= 5,
    LESSON_10: completedLessons >= 10,
    LESSON_25: completedLessons >= 25,
    LESSON_50: completedLessons >= 50,
    QUIZ_1: quizAttempts.length >= 1,
    QUIZ_PERFECT: perfectQuizzes >= 1,
    QUIZ_10: quizAttempts.length >= 10,
    QUIZ_HIGH_5: highScoreQuizzes >= 5,
    STREAK_3: (userPoints?.streak || 0) >= 3,
    STREAK_7: (userPoints?.streak || 0) >= 7,
    STREAK_14: (userPoints?.streak || 0) >= 14,
    ENROLL_1: enrollments >= 1,
    ENROLL_3: enrollments >= 3,
  };

  for (const badge of allBadges) {
    if (conditionMet[badge.condition] && !earnedConditions.includes(badge.id)) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newBadges.push(badge.name);
    }
  }

  return newBadges;
}

export async function updateStreak(userId: string) {
  const userPoints = await prisma.userPoints.findUnique({ where: { userId } });

  const now = new Date();
  const lastLogin = userPoints?.lastLogin || new Date(0);
  const diffDays = Math.floor(
    (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = userPoints?.streak || 0;

  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  }

  await prisma.userPoints.upsert({
    where: { userId },
    update: { streak: newStreak, lastLogin: now },
    create: { userId, streak: newStreak, lastLogin: now },
  });

  return newStreak;
}