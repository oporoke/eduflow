import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stkPush } from "@/lib/mpesa";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { feeStructureId, phone, amount, studentId } = await req.json();

  if (!feeStructureId || !phone || !amount) {
    return NextResponse.json({ error: "feeStructureId, phone and amount required" }, { status: 400 });
  }

  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
    include: { classroom: true },
  });

  if (!feeStructure) {
    return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
  }

  try {
    const result = await stkPush(
      phone,
      parseFloat(amount),
      `FEES-${feeStructureId.slice(0, 8)}`,
      `School fees - ${feeStructure.term} ${feeStructure.academicYear}`
    );

    if (result.ResponseCode === "0") {
      const payment = await prisma.feePayment.create({
        data: {
          feeStructureId,
          studentId: studentId || userId,
          amount: parseFloat(amount),
          phone,
          status: "PENDING",
          checkoutId: result.CheckoutRequestID,
        },
      });

      return NextResponse.json({
        message: "STK push sent. Check your phone to complete payment.",
        checkoutId: result.CheckoutRequestID,
        paymentId: payment.id,
      });
    } else {
      return NextResponse.json({ error: "Failed to initiate payment" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("M-Pesa error:", error?.response?.data || error.message);
    return NextResponse.json({ error: "M-Pesa request failed" }, { status: 500 });
  }
}