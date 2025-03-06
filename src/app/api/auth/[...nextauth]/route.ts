import NextAuth from "next-auth";
import { getAuthOptions } from "./auth.config";

const handler = NextAuth(getAuthOptions());

export { handler as GET, handler as POST };
