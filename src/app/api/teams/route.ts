import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        jiraBoards: true,
      },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 400 }
      );
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        jiraBoards: true,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
