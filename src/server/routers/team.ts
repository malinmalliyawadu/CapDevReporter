import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const teamRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.team.findMany({
      include: {
        members: true,
        projects: true,
      },
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.team.findUnique({
      where: { id: input },
      include: {
        members: true,
        projects: true,
      },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { memberIds, ...data } = input;
      return ctx.prisma.team.create({
        data: {
          ...data,
          members: memberIds
            ? {
                connect: memberIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          members: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, memberIds, ...data } = input;
      return ctx.prisma.team.update({
        where: { id },
        data: {
          ...data,
          members: memberIds
            ? {
                set: memberIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          members: true,
        },
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.team.delete({
      where: { id: input },
    });
  }),
});
