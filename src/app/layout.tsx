import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Safaricharger Web CMS - Welcome",
  description: "Welcome to the web CMS for Safaricharger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body>
        <AppThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                boxShadow:
                  "0 10px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)",
              },
              success: {
                iconTheme: {
                  primary: "var(--color-primary)",
                  secondary: "var(--color-surface)",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "var(--color-surface)",
                },
              },
            }}
          />
        </AppThemeProvider>
      </body>
    </html>
  );
}
