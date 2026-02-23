import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const audio = await prisma.audioLesson.findUnique({
    where: { lessonId },
  });

  return NextResponse.json(audio);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId, audioUrl, duration, transcript, chapters, language } = await req.json();

  if (!lessonId || !audioUrl) {
    return NextResponse.json({ error: "lessonId and audioUrl required" }, { status: 400 });
  }

  const audio = await prisma.audioLesson.upsert({
    where: { lessonId },
    update: { audioUrl, duration, transcript, chapters, language: language || "en" },
    create: { lessonId, audioUrl, duration, transcript, chapters, language: language || "en" },
  });

  return NextResponse.json(audio);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  await prisma.audioLesson.delete({ where: { lessonId } });

  return NextResponse.json({ message: "Audio deleted" });
}