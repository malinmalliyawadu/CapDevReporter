import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export async function getSession() {
  if (process.env.DISABLE_AUTH) {
    return {
      user: {
        name: "User",
      },
    };
  }

  return await getServerSession(getAuthOptions());
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
