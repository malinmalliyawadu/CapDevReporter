import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const employeeAssignmentRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        employeeId: z.string(),
        teamId: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employeeAssignment.create({
        data: {
          employeeId: input.employeeId,
          teamId: input.teamId,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
        },
        include: {
          team: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        teamId: z.string(),
        startDate: z.date(),
        endDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.employeeAssignment.update({
        where: { id },
        data,
        include: {
          team: true,
        },
      });
    }),

  getByEmployeeId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.employeeAssignment.findMany({
        where: { employeeId: input },
        include: {
          team: true,
        },
        orderBy: { startDate: "desc" },
      });
    }),
});
