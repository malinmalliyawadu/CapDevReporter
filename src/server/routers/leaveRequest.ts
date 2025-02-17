import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const leaveRequestRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.leaveRequest.findMany({
      include: {
        user: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.leaveRequest.findUnique({
      where: { id: input },
      include: {
        user: true,
      },
    });
  }),

  getByUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, status } = input;
      return ctx.prisma.leaveRequest.findMany({
        where: {
          userId,
          ...(status ? { status } : {}),
        },
        include: {
          user: true,
        },
        orderBy: {
          startDate: "desc",
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        type: z.string(),
        description: z.string().optional(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.leaveRequest.create({
        data: input,
        include: {
          user: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.string().optional(),
        type: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.leaveRequest.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      return ctx.prisma.leaveRequest.update({
        where: { id },
        data: { status },
        include: {
          user: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.leaveRequest.delete({
      where: { id: input },
    });
  }),
});
