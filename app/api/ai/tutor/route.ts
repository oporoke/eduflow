import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { message, history, subjectId, topicId, classroomId } = await req.json();

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Get context about the student
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      classrooms: {
        include: {
          classroom: {
            include: {
              subjects: true,
            },
          },
        },
      },
    },
  });

  // Get subject/topic context if provided
  let subjectName = "";
  let topicName = "";

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    subjectName = subject?.name || "";
  }

  if (topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    topicName = topic?.name || "";
  }

  const classNames = user?.classrooms?.map((c: any) => c.classroom.name).join(", ") || "unknown";

  const systemPrompt = `You are EduBot, a friendly and encouraging AI tutor for Kenyan students using the CBC (Competency Based Curriculum) system.

Student: ${user?.name}
Class: ${classNames}
${subjectName ? `Subject: ${subjectName}` : ""}
${topicName ? `Topic: ${topicName}` : ""}

Your role:
- Explain concepts clearly and simply, appropriate for the student's level
- Use examples relevant to Kenya and African context where possible
- Be encouraging and positive — never make the student feel stupid
- Break down complex problems into simple steps
- If asked about a topic, give a clear explanation then ask if they understood
- Use analogies and real-world examples
- For mathematics, show step-by-step working
- For sciences, relate concepts to everyday Kenyan life
- Keep responses concise — 2-4 paragraphs maximum
- End responses with a follow-up question to check understanding or encourage deeper thinking
- Never do homework for students — guide them to find the answer themselves
- Respond in English unless the student writes in Kiswahili, in which case respond in Kiswahili`;

  const contents = [
    ...(history || []).map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

    // Log the topic being asked about for teacher analytics
    if (subjectId) {
      await prisma.notification.create({
        data: {
          userId,
          message: `📚 EduBot session: ${subjectName ? subjectName : "General"} — "${message.substring(0, 60)}${message.length > 60 ? "..." : ""}"`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}