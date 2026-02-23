import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const stkCallback = body?.Body?.stkCallback;
  if (!stkCallback) return NextResponse.json({ message: "Invalid callback" });

  const checkoutId = stkCallback.CheckoutRequestID;
  const resultCode = stkCallback.ResultCode;

  if (resultCode === 0) {
    // Payment successful
    const metadata = stkCallback.CallbackMetadata?.Item || [];
    const mpesaCode = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
    const amount = metadata.find((i: any) => i.Name === "Amount")?.Value;

    await prisma.feePayment.updateMany({
      where: { checkoutId },
      data: {
        status: "COMPLETED",
        mpesaCode: mpesaCode || null,
        amount: amount || undefined,
      },
    });

    // Notify student
    const payment = await prisma.feePayment.findFirst({ where: { checkoutId } });
    if (payment) {
      await prisma.notification.create({
        data: {
          userId: payment.studentId,
          message: `✅ Fee payment of KES ${amount} confirmed. M-Pesa code: ${mpesaCode}`,
        },
      });
    }
  } else {
    // Payment failed or cancelled
    await prisma.feePayment.updateMany({
      where: { checkoutId },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}