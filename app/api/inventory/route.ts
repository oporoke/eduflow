import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");

  const assets = await prisma.asset.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(status && { status }),
    },
    include: {
      category: true,
      assignedTo: { select: { id: true, name: true } },
      maintenanceLogs: { orderBy: { date: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.assetCategory.findMany({
    include: { assets: true },
  });

  return NextResponse.json({ assets, categories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, name, description, serialNumber, categoryId, categoryName, status, condition, location, purchaseDate, purchaseCost, assignedToId } = await req.json();

  // Handle category creation
  if (type === "category") {
    if (!categoryName) return NextResponse.json({ error: "categoryName required" }, { status: 400 });
    const category = await prisma.assetCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    return NextResponse.json(category, { status: 201 });
  }

  if (!name || !categoryId) {
    return NextResponse.json({ error: "name and categoryId required" }, { status: 400 });
  }

  const asset = await prisma.asset.create({
    data: {
      name, description, serialNumber, categoryId,
      status: status || "AVAILABLE",
      condition: condition || "GOOD",
      location, assignedToId,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, condition, assignedToId, location, maintenanceDescription, maintenanceCost, maintenanceDate } = await req.json();

  if (maintenanceDescription) {
    await prisma.assetMaintenance.create({
      data: {
        assetId: id,
        description: maintenanceDescription,
        cost: maintenanceCost ? parseFloat(maintenanceCost) : null,
        date: maintenanceDate ? new Date(maintenanceDate) : new Date(),
      },
    });
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(condition && { condition }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(location !== undefined && { location }),
    },
  });

  return NextResponse.json(asset);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.asset.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}