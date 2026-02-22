import bcrypt from "bcryptjs";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

async function main() {
  const badges = [
    // Lesson badges
    { name: "First Step", description: "Complete your first lesson", icon: "🎯", condition: "LESSON_1" },
    { name: "On a Roll", description: "Complete 5 lessons", icon: "🔥", condition: "LESSON_5" },
    { name: "Knowledge Seeker", description: "Complete 10 lessons", icon: "📚", condition: "LESSON_10" },
    { name: "Lesson Master", description: "Complete 25 lessons", icon: "🏆", condition: "LESSON_25" },
    { name: "Scholar", description: "Complete 50 lessons", icon: "🎓", condition: "LESSON_50" },

    // Quiz badges
    { name: "Quiz Rookie", description: "Take your first quiz", icon: "✏️", condition: "QUIZ_1" },
    { name: "Perfect Score", description: "Score 100% on a quiz", icon: "💯", condition: "QUIZ_PERFECT" },
    { name: "Quiz Champion", description: "Take 10 quizzes", icon: "🥇", condition: "QUIZ_10" },
    { name: "High Achiever", description: "Score above 80% on 5 quizzes", icon: "⭐", condition: "QUIZ_HIGH_5" },

    // Streak badges
    { name: "3 Day Streak", description: "Log in 3 days in a row", icon: "📅", condition: "STREAK_3" },
    { name: "Week Warrior", description: "Log in 7 days in a row", icon: "🗓️", condition: "STREAK_7" },
    { name: "Dedicated Learner", description: "Log in 14 days in a row", icon: "💪", condition: "STREAK_14" },

    // Enrollment badges
    { name: "Class Joiner", description: "Enroll in your first class", icon: "🏫", condition: "ENROLL_1" },
    { name: "Multi-Tasker", description: "Enroll in 3 classes", icon: "🎒", condition: "ENROLL_3" },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { id: b.condition },
      update: {},
      create: b,
    });
  }

  console.log("Badges seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
