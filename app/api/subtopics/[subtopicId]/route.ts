import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subtopicId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subtopicId } = await params;

  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: {
      topic: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!subtopic) return NextResponse.json({ error: "Subtopic not found" }, { status: 404 });

  return NextResponse.json({
    ...subtopic,
    classroomId: subtopic.topic.subject.classroomId,
  });
}