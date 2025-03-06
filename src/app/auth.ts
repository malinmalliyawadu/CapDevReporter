import NextAuth from "next-auth";
import { getAuthOptions } from "./api/auth/[...nextauth]/auth.config";

const { auth } = NextAuth(getAuthOptions());

export { auth };
