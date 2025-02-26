"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  jiraId: string;
  isCapDev: boolean;
  board: {
    team: {
      name: string;
    };
  };
  activities?: ProjectActivity[];
}

interface ProjectActivity {
  activityDate: string | Date;
  jiraIssueId: string;
}

export interface JiraBoard {
  id: string;
  boardId: string;
  name: string;
  team: {
    name: string;
  };
}

export async function deleteProject(projectId: string): Promise<boolean> {
  if (!projectId) {
    console.error("No project ID provided");
    return false;
  }

  try {
    // First verify the project exists
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        activities: true,
      },
    });

    if (!projectExists) {
      console.error(`Project with ID ${projectId} not found`);
      return false;
    }

    // Use a transaction to ensure all related records are deleted
    await prisma.$transaction(async (tx) => {
      // Delete all activities first
      if (projectExists.activities.length > 0) {
        await tx.projectActivity.deleteMany({
          where: { project: { id: projectId } },
        });
      }

      // Then delete the project
      await tx.project.delete({
        where: { id: projectId },
      });
    });

    console.log(
      `Successfully deleted project ${projectId} and all related records`
    );
    revalidatePath("/data/projects");
    return true;
  } catch (error) {
    // Log the full error for debugging
    console.error("Detailed error deleting project:", {
      projectId,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
    });
    return false;
  }
}

export async function getProjects(params: {
  page: number;
  size: number;
  search?: string;
}) {
  const { page, size, search } = params;

  let where = {};

  if (search) {
    if (search.toLowerCase().startsWith("jira:")) {
      // Exact match for Jira ID
      const jiraId = search.slice(5); // Remove "jira:" prefix
      where = {
        jiraId: {
          equals: jiraId,
        },
      };
    } else {
      // Regular search across multiple fields
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { name: { contains: searchLower } },
          { description: { contains: searchLower } },
          { jiraId: { contains: searchLower } },
        ],
      };
    }
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        board: {
          include: {
            team: true,
          },
        },
        activities: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
}

export async function getBoards(): Promise<JiraBoard[]> {
  try {
    const boards = await prisma.jiraBoard.findMany({
      include: {
        team: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return boards;
  } catch (error) {
    console.error("Error fetching boards:", error);
    throw new Error("Failed to fetch boards");
  }
}
