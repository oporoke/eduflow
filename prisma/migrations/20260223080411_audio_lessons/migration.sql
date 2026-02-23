-- CreateTable
CREATE TABLE "AudioLesson" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER,
    "transcript" TEXT,
    "chapters" JSONB,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioLesson_lessonId_key" ON "AudioLesson"("lessonId");

-- AddForeignKey
ALTER TABLE "AudioLesson" ADD CONSTRAINT "AudioLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
