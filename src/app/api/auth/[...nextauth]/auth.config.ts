import { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

if (!process.env.AZURE_AD_CLIENT_ID) {
  throw new Error("AZURE_AD_CLIENT_ID is not set");
}
if (!process.env.AZURE_AD_CLIENT_SECRET) {
  throw new Error("AZURE_AD_CLIENT_SECRET is not set");
}
if (!process.env.AZURE_AD_TENANT_ID) {
  throw new Error("AZURE_AD_TENANT_ID is not set");
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login page on error
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
