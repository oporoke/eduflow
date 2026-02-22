import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Kenya tax calculation helpers
function calculateNHIF(grossSalary: number): number {
  if (grossSalary <= 5999) return 150;
  if (grossSalary <= 7999) return 300;
  if (grossSalary <= 11999) return 400;
  if (grossSalary <= 14999) return 500;
  if (grossSalary <= 19999) return 600;
  if (grossSalary <= 24999) return 750;
  if (grossSalary <= 29999) return 850;
  if (grossSalary <= 34999) return 900;
  if (grossSalary <= 39999) return 950;
  if (grossSalary <= 44999) return 1000;
  if (grossSalary <= 49999) return 1100;
  if (grossSalary <= 59999) return 1200;
  if (grossSalary <= 69999) return 1300;
  if (grossSalary <= 79999) return 1400;
  if (grossSalary <= 89999) return 1500;
  if (grossSalary <= 99999) return 1600;
  return 1700;
}

function calculateNSSF(grossSalary: number): number {
  return Math.min(grossSalary * 0.06, 1080);
}

function calculatePAYE(grossSalary: number): number {
  if (grossSalary <= 24000) return 0;
  if (grossSalary <= 32333) return (grossSalary - 24000) * 0.25;
  if (grossSalary <= 500000) return 2083 + (grossSalary - 32333) * 0.3;
  return 2083 + 140300 + (grossSalary - 500000) * 0.325;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role === "ADMIN") {
    const periods = await prisma.payrollPeriod.findMany({
      include: {
        payslips: {
          include: {
            staff: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(periods);
  }

  // Teachers see their own payslips
  const payslips = await prisma.payslip.findMany({
    where: { staffId: userId },
    include: { period: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payslips);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const createdById = (session.user as any).id;
  const { month, year } = await req.json();

  if (!month || !year) {
    return NextResponse.json({ error: "month and year required" }, { status: 400 });
  }

  const period = await prisma.payrollPeriod.create({
    data: { month, year, createdById },
  });

  return NextResponse.json(period, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, periodId, staffId, basicSalary, allowances, deductions, status, payslipId } = await req.json();

  if (type === "addPayslip") {
    const gross = parseFloat(basicSalary) + parseFloat(allowances || 0);
    const nhif = calculateNHIF(gross);
    const nssf = calculateNSSF(gross);
    const paye = calculatePAYE(gross);
    const totalDeductions = parseFloat(deductions || 0) + nhif + nssf + paye;
    const netSalary = gross - totalDeductions;

    const payslip = await prisma.payslip.upsert({
      where: { periodId_staffId: { periodId, staffId } },
      update: { basicSalary: parseFloat(basicSalary), allowances: parseFloat(allowances || 0), deductions: parseFloat(deductions || 0), nhif, nssf, paye, netSalary },
      create: { periodId, staffId, basicSalary: parseFloat(basicSalary), allowances: parseFloat(allowances || 0), deductions: parseFloat(deductions || 0), nhif, nssf, paye, netSalary },
    });

    return NextResponse.json(payslip);
  }

  if (type === "updateStatus") {
    if (payslipId) {
      await prisma.payslip.update({ where: { id: payslipId }, data: { status } });
    } else if (periodId) {
      await prisma.payrollPeriod.update({ where: { id: periodId }, data: { status } });
      if (status === "PROCESSED") {
        await prisma.payslip.updateMany({ where: { periodId }, data: { status: "PAID" } });
      }
    }
    return NextResponse.json({ message: "Status updated" });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}