import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { SyncDialogWrapper } from "@/components/providers/sync-dialog-provider";
import { AuthProvider } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CapDev Reporter",
  description: "Automated CapDev Reporting for ***REMOVED***",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SyncDialogWrapper>
              {isAuthenticated && <Navigation />}
              <main
                className={`container mx-auto ${
                  isAuthenticated ? "px-8 py-12" : "p-0"
                }`}
              >
                {children}
              </main>
              <Toaster closeButton richColors />
            </SyncDialogWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
