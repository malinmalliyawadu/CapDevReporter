import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export async function getSession() {
  return await getServerSession(authOptions);
}

// Server Action for handling auth state
export async function auth() {
  const session = await getSession();
  if (!session) return { isAuthenticated: false };

  return {
    isAuthenticated: true,
    user: session.user,
  };
}
