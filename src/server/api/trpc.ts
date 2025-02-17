import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/prisma";
import { type PrismaClient } from "@prisma/client";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

interface CreateContextOptions {
  headers: Headers;
}

export const createTRPCContext = (opts: FetchCreateContextFnOptions) => {
  return {
    prisma,
    headers: opts.req.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
