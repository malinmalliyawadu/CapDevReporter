import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const leaveRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.leave.findMany({
      include: {
        employee: true,
      },
    });
  }),

  getByEmployee: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.leave.findMany({
        where: { employeeId: input },
        include: {
          employee: true,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        date: z.date(),
        type: z.string(),
        status: z.string().default("PENDING"),
        duration: z.number(),
        employeeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.leave.create({
        data: input,
        include: {
          employee: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.date().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        duration: z.number().optional(),
        employeeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.leave.update({
        where: { id },
        data,
        include: {
          employee: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.leave.delete({
      where: { id: input },
    });
  }),
});
