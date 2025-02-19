import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { jiraClient } from "@/utils/jira";

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
      // 1. Get all boards from our database
      const boards = await ctx.prisma.jiraBoard.findMany({
        where: {
          boardId: "TF",
        },
      });

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

      // 3. Process each board and its projects
      for (const board of boards) {
        // Get all Jira projects with the board's ID
        console.log(board);
        const jiraBoard = await jiraClient.getAllBoards(
          undefined,
          undefined,
          undefined,
          "Toe-Fu"
        );

        const jiraIssues = await jiraClient.getIssuesForBoard(
          jiraBoard.values[0].id
        );

        for (const iss of jiraIssues.issues.slice(0, 100)) {
          const issue = await jiraClient.getIssue(
            iss.key,
            ["summary", "description"],
            "changelog"
          );

          processedJiraIds.add(jiraIssues.key);

          console.log(issue.key);
          console.log(existingProjectMap.has(issue.key));
          if (existingProjectMap.has(issue.key)) {
            // Update existing project
            await ctx.prisma.project.update({
              where: { id: existingProjectMap.get(issue.key) },
              data: {
                name: issue.fields.summary,
                description: issue.fields.description || null,
                isCapDev: false,
                boardId: board.id,
              },
            });
            console.log("updated");
          } else {
            // Create new project
            await ctx.prisma.project.create({
              data: {
                name: issue.fields.summary,
                description: issue.fields.description || null,
                jiraId: issue.key,
                isCapDev: false,
                boardId: board.id,
              },
            });
            console.log("created");
          }
          console.log(issue.changelog.histories[0].created);

          // clear existing activities
          await ctx.prisma.projectActivity.deleteMany({
            where: {
              jiraIssueId: issue.key,
            },
          });

          // create new activities
          const activityDates = new Set<string>(
            issue.changelog.histories.map(
              (history: { created: string }) =>
                new Date(history.created).toISOString().split("T")[0] // Only keep the date part
            )
          );

          await ctx.prisma.projectActivity.createMany({
            data: Array.from(activityDates).map((activityDate) => ({
              jiraIssueId: issue.key,
              activityDate: new Date(activityDate),
            })),
          });
        }
      }

      // 4. Delete projects that no longer exist in Jira
      // for (const [jiraId, projectId] of existingProjectMap.entries()) {
      //   if (!processedJiraIds.has(jiraId)) {
      //     await ctx.prisma.project.delete({
      //       where: { id: projectId },
      //     });
      //   }
      // }

      console.log(processedJiraIds);

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
