import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const timeTypeRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.timeType.findMany({
      include: {
        timeEntries: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.timeType.findUnique({
      where: { id: input },
      include: {
        timeEntries: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timeType.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.timeType.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.timeType.delete({
      where: { id: input },
    });
  }),
});
