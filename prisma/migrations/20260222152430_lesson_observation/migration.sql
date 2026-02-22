-- CreateTable
CREATE TABLE "LessonObservation" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "observerId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservationRating" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservationRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservationComment" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservationComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObservationRating_observationId_criteria_key" ON "ObservationRating"("observationId", "criteria");

-- AddForeignKey
ALTER TABLE "LessonObservation" ADD CONSTRAINT "LessonObservation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonObservation" ADD CONSTRAINT "LessonObservation_observerId_fkey" FOREIGN KEY ("observerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonObservation" ADD CONSTRAINT "LessonObservation_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationRating" ADD CONSTRAINT "ObservationRating_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "LessonObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationComment" ADD CONSTRAINT "ObservationComment_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "LessonObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
