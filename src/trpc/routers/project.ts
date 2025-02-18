import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { jiraClient, isCapDevProject } from "@/utils/jira";
import type { JiraProject } from "@/utils/jira";

export const projectRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.prisma.project.findMany({
      include: {
        board: {
          include: {
            team: true,
          },
        },
        timeEntries: {
          select: {
            date: true,
          },
        },
      },
    });

    // Fetch activities for each project
    const projectsWithActivities = await Promise.all(
      projects.map(async (project) => {
        const activities = await ctx.prisma.projectActivity.findMany({
          where: {
            jiraIssueId: project.jiraId,
          },
          orderBy: {
            activityDate: "desc",
          },
          select: {
            id: true,
            jiraIssueId: true,
            activityDate: true,
          },
        });
        return {
          ...project,
          activities,
        };
      })
    );

    return projectsWithActivities;
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const project = await ctx.prisma.project.findUnique({
      where: { id: input },
      include: {
        board: {
          include: {
            team: true,
          },
        },
        timeEntries: {
          select: {
            date: true,
          },
        },
      },
    });

    if (!project) return null;

    const activities = await ctx.prisma.projectActivity.findMany({
      where: {
        jiraIssueId: project.jiraId,
      },
      orderBy: {
        activityDate: "desc",
      },
      select: {
        id: true,
        jiraIssueId: true,
        activityDate: true,
      },
    });

    return {
      ...project,
      activities,
    };
  }),

  getByTeam: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const projects = await ctx.prisma.project.findMany({
      where: {
        board: {
          teamId: input,
        },
      },
      include: {
        board: {
          include: {
            team: true,
          },
        },
        timeEntries: {
          select: {
            date: true,
          },
        },
      },
    });

    // Fetch activities for each project
    const projectsWithActivities = await Promise.all(
      projects.map(async (project) => {
        const activities = await ctx.prisma.projectActivity.findMany({
          where: {
            jiraIssueId: project.jiraId,
          },
          orderBy: {
            activityDate: "desc",
          },
          select: {
            id: true,
            jiraIssueId: true,
            activityDate: true,
          },
        });
        return {
          ...project,
          activities,
        };
      })
    );

    return projectsWithActivities;
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        boardId: z.string(),
        jiraId: z.string(),
        isCapDev: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.project.create({
        data: input,
        include: {
          board: {
            include: {
              team: true,
            },
          },
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        boardId: z.string().optional(),
        jiraId: z.string().optional(),
        isCapDev: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.project.update({
        where: { id },
        data,
        include: {
          board: {
            include: {
              team: true,
            },
          },
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.project.delete({
      where: { id: input },
    });
  }),

  sync: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // 1. Fetch all projects from Jira
      const jiraProjects = (await jiraClient.listProjects()) as JiraProject[];

      // 2. Get all existing projects from our database
      const existingProjects = await ctx.prisma.project.findMany({
        select: {
          id: true,
          jiraId: true,
        },
      });

      // Create a map for faster lookups
      const existingProjectMap = new Map(
        existingProjects.map((p) => [p.jiraId, p.id])
      );
      const processedJiraIds = new Set();

      // 3. Process each Jira project
      for (const jiraProject of jiraProjects) {
        processedJiraIds.add(jiraProject.key);

        // Get detailed project information including description and category
        const projectDetails = (await jiraClient.getProject(
          jiraProject.key
        )) as JiraProject;

        // Find the corresponding board based on the Jira project key prefix
        const boardId = jiraProject.key.split("-")[0];
        const board = await ctx.prisma.jiraBoard.findFirst({
          where: { boardId },
        });

        if (!board) {
          console.warn(
            `No matching board found for project ${jiraProject.key}`
          );
          continue;
        }

        if (existingProjectMap.has(jiraProject.key)) {
          // Update existing project
          await ctx.prisma.project.update({
            where: { id: existingProjectMap.get(jiraProject.key) },
            data: {
              name: projectDetails.name,
              description: projectDetails.description || null,
              isCapDev: isCapDevProject(projectDetails),
              boardId: board.id,
            },
          });
        } else {
          // Create new project
          await ctx.prisma.project.create({
            data: {
              name: projectDetails.name,
              description: projectDetails.description || null,
              jiraId: projectDetails.key,
              isCapDev: isCapDevProject(projectDetails),
              boardId: board.id,
            },
          });
        }
      }

      // 4. Delete projects that no longer exist in Jira
      for (const [jiraId, projectId] of existingProjectMap.entries()) {
        if (!processedJiraIds.has(jiraId)) {
          await ctx.prisma.project.delete({
            where: { id: projectId },
          });
        }
      }

      return {
        success: true,
        message: "Projects synced with Jira",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Failed to sync with Jira:", error);
      throw new Error("Failed to sync with Jira");
    }
  }),
});
