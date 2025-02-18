import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const employeesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const employees = await ctx.prisma.employee.findMany({
      include: {
        role: true,
        assignments: {
          include: {
            team: true,
          },
          where: {
            endDate: null,
          },
        },
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
      const { teamId, ...employeeData } = input;
      const employee = await ctx.prisma.employee.create({
        data: {
          ...employeeData,
          assignments: {
            create: {
              teamId,
              startDate: new Date(),
            },
          },
        },
        include: {
          role: true,
          assignments: {
            include: {
              team: true,
            },
            where: {
              endDate: null,
            },
          },
        },
      });
      return employee;
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
