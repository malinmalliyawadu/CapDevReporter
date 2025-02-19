import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        employees: true,
      },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate role names
    const existingRole = await prisma.role.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 400 }
      );
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
