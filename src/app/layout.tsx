import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { SyncDialogWrapper } from "@/components/providers/sync-dialog-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Timesheet",
  description: "Track your time with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SyncDialogWrapper>
            <div className="min-h-screen">
              <Navigation />
              <main className="container mx-auto px-8 py-12">{children}</main>
              <Toaster />
            </div>
          </SyncDialogWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
