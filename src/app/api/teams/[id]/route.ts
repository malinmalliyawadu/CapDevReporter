import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

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
        NOT: {
          id: id,
        },
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 400 }
      );
    }

    // Update team
    const team = await prisma.team.update({
      where: { id },
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
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if team exists and has no projects
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        jiraBoards: {
          include: {
            projects: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const hasProjects = team.jiraBoards.some(
      (board) => board.projects.length > 0
    );
    if (hasProjects) {
      return NextResponse.json(
        {
          error:
            "Cannot delete team with associated projects. Please delete or reassign all projects first.",
        },
        { status: 400 }
      );
    }

    // Delete team
    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
