import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function NotFound() {
  const { isAuthenticated } = await auth();

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-2">
      <h2 className="text-2xl font-semibold">404 - Page Not Found</h2>
      <p className="text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Button asChild className="mt-4">
        <Link href={isAuthenticated ? "/" : "/login"}>
          Go back to {isAuthenticated ? "home" : "login"}
        </Link>
      </Button>
    </div>
  );
}
