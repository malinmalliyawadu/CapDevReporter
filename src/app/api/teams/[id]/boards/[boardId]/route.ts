import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; boardId: string } }
) {
  try {
    const { id, boardId } = params;

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if board exists and belongs to team
    const board = await prisma.jiraBoard.findFirst({
      where: {
        id: boardId,
        teamId: id,
      },
      include: {
        projects: true,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if board has projects
    if (board.projects.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete board with associated projects. Please delete or reassign all projects first.",
        },
        { status: 400 }
      );
    }

    // Delete board
    await prisma.jiraBoard.delete({
      where: { id: boardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
