import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const generalTimeAssignmentsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const assignments = await ctx.prisma.generalTimeAssignment.findMany({
      include: {
        role: true,
        timeType: true,
      },
    });

    const roles = await ctx.prisma.role.findMany();
    const timeTypes = await ctx.prisma.timeType.findMany();

    return { assignments, roles, timeTypes };
  }),

  create: publicProcedure
    .input(
      z.object({
        roleId: z.string(),
        timeTypeId: z.string(),
        hoursPerWeek: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.generalTimeAssignment.create({
        data: input,
        include: {
          role: true,
          timeType: true,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.generalTimeAssignment.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});
