import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";


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
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
