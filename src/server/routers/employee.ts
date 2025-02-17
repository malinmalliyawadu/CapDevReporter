import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const employeeRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.employee.findMany({
      include: {
        team: true,
        role: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.employee.findUnique({
      where: { id: input },
      include: {
        team: true,
        role: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        payrollId: z.string(),
        roleId: z.string(),
        teamId: z.string(),
        hoursPerWeek: z.number(),
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

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        payrollId: z.string().optional(),
        roleId: z.string().optional(),
        teamId: z.string().optional(),
        hoursPerWeek: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.employee.update({
        where: { id },
        data,
        include: {
          team: true,
          role: true,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.delete({
        where: { id: input.id },
      });
    }),
});
