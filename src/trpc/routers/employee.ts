import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { type Prisma } from "@prisma/client";

const defaultEmployeeSelect = {
  id: true,
  name: true,
  payrollId: true,
  hoursPerWeek: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,
  role: true,
  assignments: {
    include: {
      team: true,
    },
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
        hoursPerWeek: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.create({
        data: input,
        include: {
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
        hoursPerWeek: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.employee.update({
        where: { id },
        data,
        include: {
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

  updateHoursPerWeek: publicProcedure
    .input(
      z.object({
        id: z.string(),
        hoursPerWeek: z.number().min(0).max(168),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.update({
        where: { id: input.id },
        data: {
          hoursPerWeek: input.hoursPerWeek,
        },
        select: defaultEmployeeSelect,
      });
    }),

  sync: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Add actual iPayroll API integration
    // For now, we'll simulate the API call with mock data
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock data - in reality this would come from iPayroll API
    const mockEmployees = [
      {
        name: "John Doe",
        payrollId: "IP001",
        roleId: "role_1", // This would need to map to actual role IDs
      },
      // ... more employees
    ];

    // Upsert each employee from iPayroll
    for (const employee of mockEmployees) {
      await ctx.prisma.employee.upsert({
        where: { payrollId: employee.payrollId },
        create: {
          ...employee,
          hoursPerWeek: 40, // Default value
        },
        update: {
          name: employee.name,
          roleId: employee.roleId,
          // Note: We don't update hoursPerWeek here as it's manually set
        },
      });
    }

    return {
      success: true,
      message: "Employees synced with iPayroll",
    };
  }),
});
