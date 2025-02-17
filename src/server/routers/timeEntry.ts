import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const timeEntryRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.timeEntry.findMany({
      include: {
        user: true,
        project: true,
        timeType: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.timeEntry.findUnique({
      where: { id: input },
      include: {
        user: true,
        project: true,
        timeType: true,
      },
    });
  }),

  getByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, startDate, endDate } = input;
      return ctx.prisma.timeEntry.findMany({
        where: {
          userId,
          ...(startDate && endDate
            ? {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              }
            : {}),
        },
        include: {
          user: true,
          project: true,
          timeType: true,
        },
        orderBy: {
          date: "desc",
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        date: z.date(),
        hours: z.number(),
        description: z.string().optional(),
        userId: z.string(),
        projectId: z.string(),
        timeTypeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timeEntry.create({
        data: input,
        include: {
          user: true,
          project: true,
          timeType: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.date().optional(),
        hours: z.number().optional(),
        description: z.string().optional(),
        projectId: z.string().optional(),
        timeTypeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.timeEntry.update({
        where: { id },
        data,
        include: {
          user: true,
          project: true,
          timeType: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.timeEntry.delete({
      where: { id: input },
    });
  }),
});
