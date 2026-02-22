/*
  Warnings:

  - You are about to drop the column `classId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the `ClassGrade` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,classroomId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classroomId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClassGrade" DROP CONSTRAINT "ClassGrade_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_classId_fkey";

-- DropIndex
DROP INDEX "Enrollment_studentId_classId_key";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "classId",
ADD COLUMN     "classroomId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ClassGrade";

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classroomId_key" ON "Enrollment"("studentId", "classroomId");

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
