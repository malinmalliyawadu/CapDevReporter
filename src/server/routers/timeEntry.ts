import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const timeEntryRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.timeEntry.findMany({
      include: {
        employee: true,
        project: true,
        timeType: true,
      },
      orderBy: {
        date: "desc",
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.timeEntry.findUnique({
      where: { id: input },
      include: {
        employee: true,
        project: true,
        timeType: true,
      },
    });
  }),

  getByEmployee: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.timeEntry.findMany({
        where: { employeeId: input },
        include: {
          employee: true,
          project: true,
          timeType: true,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        date: z.date(),
        hours: z.number(),
        description: z.string().optional(),
        employeeId: z.string(),
        projectId: z.string(),
        timeTypeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timeEntry.create({
        data: input,
        include: {
          employee: true,
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
        employeeId: z.string().optional(),
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
          employee: true,
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
