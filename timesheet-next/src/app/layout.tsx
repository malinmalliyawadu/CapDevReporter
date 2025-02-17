import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/TRPCProvider";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <ThemeProvider>
          <TRPCProvider>
            <div className="min-h-screen">
              <Navigation />
              <main className="container mx-auto px-4 py-8">{children}</main>
              <Toaster />
            </div>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
