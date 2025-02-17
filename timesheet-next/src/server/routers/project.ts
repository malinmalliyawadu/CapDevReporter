import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const projectRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.project.findMany({
      include: {
        team: true,
        timeEntries: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.project.findUnique({
      where: { id: input },
      include: {
        team: true,
        timeEntries: true,
      },
    });
  }),

  getByTeam: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.project.findMany({
      where: { teamId: input },
      include: {
        team: true,
        timeEntries: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.project.create({
        data: input,
        include: {
          team: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        teamId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.project.update({
        where: { id },
        data,
        include: {
          team: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.project.delete({
      where: { id: input },
    });
  }),
});
