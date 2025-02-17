import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { prisma } from "@/lib/prisma";

export async function createContext(opts: FetchCreateContextFnOptions) {
  return {
    prisma,
    // Add more context properties here
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
