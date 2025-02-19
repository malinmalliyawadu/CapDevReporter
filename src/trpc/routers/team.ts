import { z } from "zod";
import { Context, createTRPCRouter, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.team.findMany({
      include: {
        jiraBoards: {
          include: {
            projects: true,
          },
        },
        assignments: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.team.findUnique({
      where: { id: input },
      include: {
        jiraBoards: {
          include: {
            projects: true,
          },
        },
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
      try {
        return await ctx.prisma.team.delete({
          where: { id: input },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Cannot delete team as it has associated boards with projects",
            });
          }
        }
        throw error;
      }
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
        try {
          return await ctx.prisma.jiraBoard.delete({
            where: {
              id: input.boardId,
              teamId: input.teamId,
            },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
              throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "Cannot delete board as it has associated projects",
              });
            }
          }
          throw error;
        }
      }
    ),
});
