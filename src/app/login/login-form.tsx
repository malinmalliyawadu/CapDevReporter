"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useTransition } from "react";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();

  const handleLogin = () => {
    startTransition(async () => {
      try {
        await signIn("azure-ad", { callbackUrl: "/" });
      } catch (error) {
        console.error("Login failed:", error);
      }
    });
  };

  return (
    <div className="animate-fade-in-up [--animate-delay:200ms]">
      <Card className="overflow-hidden transform transition-all duration-200 hover:scale-[1.01] hover:shadow-lg">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30" />
          <div className="relative">
            <Button
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-500 hover:from-cyan-700 hover:to-blue-700 dark:hover:from-cyan-600 dark:hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleLogin}
              disabled={isPending}
              size="lg"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                  <span className="text-base">Signing in...</span>
                </div>
              ) : (
                <span className="text-base font-medium">
                  Sign in with Microsoft
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
