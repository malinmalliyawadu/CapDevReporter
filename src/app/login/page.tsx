import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import AuthError from "./error";

export const metadata: Metadata = {
  title: "Login | Timesheet",
  description: "Login to your account",
};

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <main className="relative h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 px-4 py-12 animate-fade-in">
          <AuthError />
          <div className="space-y-2 text-center">
            <div className="inline-block animate-float">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-500 shadow-lg">
                    <svg
                      className="w-6 h-6 text-white transform rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 dark:from-cyan-400/20 dark:to-blue-500/20 rounded-xl blur-xl" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-600 dark:from-cyan-400 dark:via-cyan-400 dark:to-blue-500 bg-clip-text text-transparent animate-fade-in">
              Welcome back
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 animate-fade-in-up">
              Sign in to your account using your Azure AD credentials
            </p>
          </div>
          <LoginForm />
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 dark:text-gray-400 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                ***REMOVED*** Timesheet System
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
