import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export async function getSession() {
  if (process.env.IS_UNDER_TEST) {
    return {
      user: {
        name: "Test User",
      },
    };
  }

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
