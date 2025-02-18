import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export const metadata = {
  title: "Timesheet App",
  description: "A modern timesheet management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <TRPCProvider>
            <div className="min-h-screen">
              <Navigation />
              <main className="container mx-auto px-8 py-12">{children}</main>
              <Toaster />
            </div>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
