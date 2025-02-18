import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const employeeAssignmentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        employeeId: z.string(),
        startDate: z.date(),
        endDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employeeAssignment.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        startDate: z.date(),
        endDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.employeeAssignment.update({
        where: { id },
        data,
      });
    }),

  getByEmployeeId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.employeeAssignment.findMany({
        where: { employeeId: input },
        orderBy: { startDate: "desc" },
      });
    }),
});
