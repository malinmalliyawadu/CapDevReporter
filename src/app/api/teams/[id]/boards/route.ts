import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, boardId } = await request.json();

    // Validate input
    if (!name?.trim() || !boardId?.trim()) {
      return NextResponse.json(
        { error: "Board name and ID are required" },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check for duplicate board ID
    const existingBoard = await prisma.jiraBoard.findFirst({
      where: {
        teamId: id,
        boardId: boardId.trim(),
      },
    });

    if (existingBoard) {
      return NextResponse.json(
        { error: "This board is already assigned to the team" },
        { status: 400 }
      );
    }

    // Create board
    const board = await prisma.jiraBoard.create({
      data: {
        name: name.trim(),
        boardId: boardId.trim(),
        teamId: id,
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add board" }, { status: 500 });
  }
}
