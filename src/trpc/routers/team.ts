import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.team.findMany({
      include: {
        employees: true,
        projects: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.team.findUnique({
      where: { id: input },
      include: {
        employees: true,
        projects: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        employeeIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { employeeIds, ...data } = input;
      return ctx.prisma.team.create({
        data: {
          ...data,
          employees: employeeIds
            ? {
                connect: employeeIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          employees: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        employeeIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, employeeIds, ...data } = input;
      return ctx.prisma.team.update({
        where: { id },
        data: {
          ...data,
          employees: employeeIds
            ? {
                set: employeeIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          employees: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.team.delete({
      where: { id: input },
    });
  }),
});
