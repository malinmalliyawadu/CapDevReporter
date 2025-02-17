import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { fetchLeaveRecords } from "@/utils/ipayroll";

export const leaveRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.leave.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        date: "desc",
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

  sync: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // Fetch leave records from iPayroll
      const ipayrollLeaves = await fetchLeaveRecords();

      // Get all employees to map payrollId to employeeId
      const employees = await ctx.prisma.employee.findMany();
      const employeeMap = new Map(
        employees.map((emp) => [emp.payrollId, emp.id])
      );

      // Process each leave record
      const createOrUpdatePromises = ipayrollLeaves.map(async (leave) => {
        const employeeId = employeeMap.get(leave.employeeId);
        if (!employeeId) {
          console.warn(`No employee found for payroll ID: ${leave.employeeId}`);
          return null;
        }

        // Try to find existing leave record
        const existingLeave = await ctx.prisma.leave.findFirst({
          where: {
            employeeId,
            date: new Date(leave.date),
            type: leave.type,
          },
        });

        if (existingLeave) {
          // Update existing record
          return ctx.prisma.leave.update({
            where: { id: existingLeave.id },
            data: {
              status: leave.status,
              duration: leave.duration,
            },
          });
        } else {
          // Create new record
          return ctx.prisma.leave.create({
            data: {
              employeeId,
              date: new Date(leave.date),
              type: leave.type,
              status: leave.status,
              duration: leave.duration,
            },
          });
        }
      });

      // Wait for all operations to complete
      await Promise.all(createOrUpdatePromises);

      return {
        success: true,
        message: "Leave records synced successfully",
      };
    } catch (error) {
      console.error("Failed to sync leave records:", error);
      throw error;
    }
  }),
});
