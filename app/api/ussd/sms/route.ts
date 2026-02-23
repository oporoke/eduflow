import { auth } from "@/lib/auth";
import { sendSMS } from "@/lib/africastalking";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { phone, message } = await req.json();

  if (!phone || !message) {
    return NextResponse.json({ error: "phone and message required" }, { status: 400 });
  }

  try {
    await sendSMS(phone, message);
    return NextResponse.json({ message: "SMS sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "SMS failed" }, { status: 500 });
  }
}