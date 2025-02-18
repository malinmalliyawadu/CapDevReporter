import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { type Prisma } from "@prisma/client";

const defaultEmployeeSelect = {
  id: true,
  name: true,
  payrollId: true,
  hoursPerWeek: true,
  teamId: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,
  team: true,
  role: true,
  assignments: {
    orderBy: {
      startDate: "desc" as const,
    },
  },
} satisfies Prisma.EmployeeSelect;

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  select: typeof defaultEmployeeSelect;
}>;

export const employeeRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.employee.findMany({
      select: defaultEmployeeSelect,
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.employee.findUnique({
      where: { id: input },
      select: defaultEmployeeSelect,
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

  sync: publicProcedure.mutation(async ({}) => {
    // TODO: Add actual iPayroll API integration
    // For now, we'll simulate the API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return success response
    return {
      success: true,
      message: "Employees synced with iPayroll",
    };
  }),
});
