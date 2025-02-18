import { z } from "zod";
import { Context, createTRPCRouter, publicProcedure } from "../init";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.team.findMany({
      include: {
        projects: true,
        jiraBoards: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.team.findUnique({
      where: { id: input },
      include: {
        projects: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { name: string; description?: string };
      }) => {
        return ctx.prisma.team.create({
          data: input,
        });
      }
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { id: string; name: string; description?: string };
      }) => {
        const { id, ...data } = input;
        return ctx.prisma.team.update({
          where: { id },
          data,
        });
      }
    ),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }: { ctx: Context; input: string }) => {
      return ctx.prisma.team.delete({
        where: { id: input },
      });
    }),

  addJiraBoard: publicProcedure
    .input(
      z.object({
        teamId: z.string(),
        name: z.string(),
        boardId: z.string(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { teamId: string; name: string; boardId: string };
      }) => {
        return ctx.prisma.jiraBoard.create({
          data: {
            name: input.name,
            boardId: input.boardId,
            teamId: input.teamId,
          },
        });
      }
    ),

  removeJiraBoard: publicProcedure
    .input(
      z.object({
        teamId: z.string(),
        boardId: z.string(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { teamId: string; boardId: string };
      }) => {
        return ctx.prisma.jiraBoard.delete({
          where: {
            id: input.boardId,
            teamId: input.teamId,
          },
        });
      }
    ),
});
