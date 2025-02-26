"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type TeamWithBoards = Prisma.TeamGetPayload<{
  include: { jiraBoards: true };
}>;

type BoardWithProjects = Prisma.JiraBoardGetPayload<{
  include: { projects: true };
}>;

interface ActionResponse {
  success: boolean;
  error?: string;
  teams?: TeamWithBoards[];
}

interface BoardDetailsResponse {
  success: boolean;
  error?: string;
  board?: BoardWithProjects;
}

async function getTeams(): Promise<TeamWithBoards[]> {
  return await prisma.team.findMany({
    include: {
      jiraBoards: true,
    },
  });
}

export async function createTeam(
  data: Prisma.TeamCreateInput
): Promise<ActionResponse> {
  try {
    await prisma.team.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    });

    const teams = await getTeams();
    revalidatePath("/data/teams");
    return { success: true, teams };
  } catch (error) {
    console.error("Failed to create team:", error);
    return { success: false, error: "Failed to create team" };
  }
}

export async function updateTeam(
  id: string,
  data: Prisma.TeamUpdateInput
): Promise<ActionResponse> {
  try {
    await prisma.team.update({
      where: { id },
      data,
    });

    const teams = await getTeams();
    revalidatePath("/data/teams");
    return { success: true, teams };
  } catch (error) {
    console.error("Failed to update team:", error);
    return { success: false, error: "Failed to update team" };
  }
}

export async function deleteTeam(id: string): Promise<ActionResponse> {
  try {
    await prisma.team.delete({
      where: { id },
    });

    const teams = await getTeams();
    revalidatePath("/data/teams");
    return { success: true, teams };
  } catch (error) {
    console.error("Failed to delete team:", error);
    return { success: false, error: "Failed to delete team" };
  }
}

export async function addJiraBoard(
  data: Prisma.JiraBoardCreateInput
): Promise<ActionResponse> {
  try {
    await prisma.jiraBoard.create({
      data,
    });

    const teams = await getTeams();
    revalidatePath("/data/teams");
    return { success: true, teams };
  } catch (error) {
    console.error("Failed to add Jira board:", error);
    return { success: false, error: "Failed to add Jira board" };
  }
}

export async function getBoardDetails(
  boardId: string
): Promise<BoardDetailsResponse> {
  try {
    const board = await prisma.jiraBoard.findUnique({
      where: { id: boardId },
      include: {
        projects: true,
      },
    });

    if (!board) {
      return { success: false, error: "Board not found" };
    }

    return { success: true, board };
  } catch (error) {
    console.error("Failed to get board details:", error);
    return { success: false, error: "Failed to get board details" };
  }
}

export async function deleteJiraBoard(
  teamId: string,
  boardId: string
): Promise<ActionResponse> {
  try {
    // Check for associated projects first
    const boardDetails = await prisma.jiraBoard.findUnique({
      where: { id: boardId },
      include: {
        projects: {
          select: {
            id: true,
          },
        },
      },
    });

    if (boardDetails?.projects.length) {
      return {
        success: false,
        error: "Cannot delete board: It has associated projects",
      };
    }

    await prisma.jiraBoard.delete({
      where: { id: boardId },
    });

    const teams = await getTeams();
    revalidatePath("/data/teams");
    return { success: true, teams };
  } catch (error: any) {
    console.error("Failed to delete Jira board:", error);
    return {
      success: false,
      error: "Failed to delete Jira board",
    };
  }
}
