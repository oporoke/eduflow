import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkTransactionStatus } from "@/lib/mpesa";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const checkoutId = searchParams.get("checkoutId");

  if (!checkoutId) return NextResponse.json({ error: "checkoutId required" }, { status: 400 });

  try {
    const result = await checkTransactionStatus(checkoutId);
    const payment = await prisma.feePayment.findFirst({ where: { checkoutId } });
    return NextResponse.json({ status: payment?.status, mpesaResult: result });
  } catch {
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}