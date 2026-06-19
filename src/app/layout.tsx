import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const fontSans = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Safaricharge Web CMS - Welcome",
  description: "Welcome to the web CMS for Safaricharge",
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
                boxShadow: "var(--shadow-elevated)",
              },
              success: {
                iconTheme: {
                  primary: "var(--color-primary)",
                  secondary: "var(--color-surface)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--danger-solid)",
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
