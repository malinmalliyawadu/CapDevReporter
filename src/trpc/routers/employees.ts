import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const employeesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const employees = await ctx.prisma.employee.findMany({
      include: {
        team: true,
        role: true,
      },
    });

    const teams = await ctx.prisma.team.findMany();
    const roles = await ctx.prisma.role.findMany();

    return { employees, teams, roles };
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        payrollId: z.string(),
        roleId: z.string(),
        teamId: z.string(),
        hoursPerWeek: z.number().default(40),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.create({
        data: input,
        include: {
          team: true,
          role: true,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.employee.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});
